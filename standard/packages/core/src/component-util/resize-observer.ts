
const resizeObserverEnabled = true
const resizeObserverBorderBoxEnabled = true
const fallbackTimeout = 50

if (!resizeObserverEnabled) {
  (window as any).watchSize = watchSizeFallback // for testing
}

// COMMON
// -------------------------------------------------------------------------------------------------

type ResizeConfig = {
  callback: ResizeCallback
  client?: boolean // watch and report clientWidth/clientHeight?
  width?: number // only used by fallback technique
  height?: number // only used by fallback technique
}

const configMap = new Map<Element, ResizeConfig>()
const afterSizeCallbacks = new Set<() => void>()
let isHandling = false

export function afterSize(callback: () => void) {
  if (isHandling) {
    afterSizeCallbacks.add(callback)
  } else {
    callback() // TODO: should we queue microtask?
  }
}

function flushAfterSize() {
  for (const flushedCallback of afterSizeCallbacks.values()) {
    flushedCallback()
    afterSizeCallbacks.delete(flushedCallback)
  }
}

// Native Technique ONLY
// -------------------------------------------------------------------------------------------------

function watchSizeNative(
  el: HTMLElement,
  callback: ResizeCallback,
  client?: boolean,
) {
  configMap.set(el, { callback, client })
  resizeObserver.observe(el, {
    box: !client && resizeObserverBorderBoxEnabled
      ? 'border-box'
      : undefined // default is 'content-box'
  })

  return () => {
    configMap.delete(el)
    resizeObserver.unobserve(el)
  }
}

// Single global ResizeObserver does batching and uses less memory than individuals
const resizeObserver = new ResizeObserver((entries) => {
  isHandling = true

  for (let entry of entries) {
    const el = entry.target
    const { callback, client } = configMap.get(el)

    if (client) {
      callback(el.clientWidth, el.clientHeight)
    } else if (entry.borderBoxSize && resizeObserverBorderBoxEnabled) {
      callback(entry.borderBoxSize[0].inlineSize, entry.borderBoxSize[0].blockSize)
    } else {
      const rect = el.getBoundingClientRect()
      callback(rect.width, rect.height)
    }
  }

  flushAfterSize()
  isHandling = false
})

// Fallback Technique ONLY
// -------------------------------------------------------------------------------------------------

function watchSizeFallback(
  el: HTMLElement,
  callback: ResizeCallback,
  client?: boolean,
) {
  if (!configMap.size) {
    addGlobalHandlers()
  }

  configMap.set(el, { callback, client })
  checkSizesAsync()

  return () => {
    configMap.delete(el)

    if (!configMap.size) {
      removeGlobalHandlers()
    }
  }
}

/*
A proper ResizeObserver polyfill would keep checking dimensions until all stabilized,
to detect if a *handler* caused a new element's dimensions to change,
while ignoring changes per-element after the first (to prevent infinite loops),
but our Preact system does not commit to the DOM immediately, commits are batched for later,
so we can skip this.
*/
function _checkSizes() {
  if (!isHandling) {
    isHandling = true

    const dirtyConfigs: ResizeConfig[] = []

    for (const [el, config] of configMap.entries()) {
      let width: number
      let height: number

      if (config.client) {
        width = el.clientWidth
        height = el.clientHeight
      } else {
        ({ width, height } = el.getBoundingClientRect())
      }

      if (width !== config.width || height !== config.height) {
        config.width = width
        config.height = height
        dirtyConfigs.push(config)
      }
    }

    for (const dirtyConfig of dirtyConfigs) {
      dirtyConfig.callback(dirtyConfig.width, dirtyConfig.height)
    }

    flushAfterSize()
    isHandling = false
  }
}

const [checkSizesAsync, cancelSizes] = debounce(_checkSizes, fallbackTimeout)

function checkSizesSync() {
  cancelSizes()
  _checkSizes()
}

// from https://github.com/juggle/resize-observer/blob/master/src/utils/scheduler.ts
const globalEventNames = [
  // Global Resize
  'resize',
  // Global Load
  'load',
  // Transitions & Animations
  'transitionend',
  'animationend',
  'animationstart',
  'animationiteration',
  // Interactions
  'keyup',
  'keydown',
  'mouseup',
  'mousedown',
  'mouseover',
  'mouseout',
  'blur',
  'focus'
]

const eventListenerConfig: AddEventListenerOptions = {
  capture: true, // only handle at top-level, no bubbling
  passive: true, // we don't call preventDefault, so can optimize
}

let globalMutationObserver: MutationObserver | undefined

function addGlobalHandlers() {
  globalMutationObserver = new MutationObserver(checkSizesAsync)
  globalMutationObserver.observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true,
  })

  for (const eventName of globalEventNames) {
    window.addEventListener(eventName, checkSizesAsync, eventListenerConfig)
  }
}

function removeGlobalHandlers() {
  globalMutationObserver.disconnect()
  globalMutationObserver = undefined

  for (const eventName of globalEventNames) {
    window.removeEventListener(eventName, checkSizesAsync, eventListenerConfig)
  }
}

// Util
// -------------------------------------------------------------------------------------------------

function debounce(fn: () => void, ms: number): [
  request: () => void,
  cancel: () => void,
] {
  let timeoutStarted: number | undefined
  let timeoutAdded: number | undefined
  let timeoutId: number | undefined // thruthiness indicates whether active timeout

  function runWithTimeout(timeout: number) {
    timeoutStarted = Date.now()
    timeoutAdded = 0
    timeoutId = setTimeout(() => {
      if (timeoutAdded) {
        runWithTimeout(timeoutAdded)
      } else {
        timeoutId = undefined
        fn()
      }
    }, timeout)
  }

  function request() {
    if (timeoutId) {
      timeoutAdded = Date.now() - timeoutStarted
    } else {
      runWithTimeout(ms)
    }
  }

  function cancel() {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
  }

  return [request, cancel]
}

// Top-level
// -------------------------------------------------------------------------------------------------
/*
PRECONDITION: element can only have one listener attached

NOTE: If we ever kill the fallback technique and use ResizeObserver unconditionally with full
border-box support, we no longer need wrappers around the <StickyFooterScrollbar>'s <Scroller>
*/

export type ResizeCallback = (width: number, height: number) => void

let watchSize: (el: HTMLElement, callback: ResizeCallback, client?: boolean) => () => void
let updateSize: () => void

if (resizeObserverEnabled && typeof ResizeObserver !== 'undefined') {
  watchSize = watchSizeNative
  updateSize = () => {} // noop
} else {
  watchSize = watchSizeFallback
  updateSize = checkSizesSync
}

export { watchSize, updateSize }

export function watchWidth(
  el: HTMLElement,
  callback: (width: number) => void,
) {
  let currentWidth: number | undefined

  return watchSize(el, (width) => {
    if (currentWidth == null || currentWidth !== width) {
      callback(currentWidth = width)
    }
  })
}

export function watchHeight(
  el: HTMLElement,
  callback: (height: number) => void,
) {
  let currentHeight: number | undefined

  return watchSize(el, (_width, height) => {
    if (currentHeight == null || currentHeight !== height) {
      callback(currentHeight = height)
    }
  })
}
