import { preactOptions } from '../preact.js'

const resizeObserverEnabled = true
const resizeObserverBorderBoxEnabled = true
const fallbackTimeout = 100

if (!resizeObserverEnabled) {
  (window as any).watchSize = watchSizeFallback // for testing
}

// Common
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
  requestCheckSizes()

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
function checkSizes() {
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

const [requestCheckSizes, cancelCheckSizes] = debounce(checkSizes, fallbackTimeout)

function requestCheckSizesSync() {
  cancelCheckSizes()
  checkSizes()
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
let globalMutationObserverPaused = false

function addGlobalHandlers() {
  globalMutationObserver = new MutationObserver(requestCheckSizes)
  if (!globalMutationObserverPaused) {
    startGlobalMutationObserver()
  }

  for (const eventName of globalEventNames) {
    window.addEventListener(eventName, requestCheckSizes, eventListenerConfig)
  }
}

function removeGlobalHandlers() {
  if (!globalMutationObserverPaused) {
    stopGlobalMutationObserver()
  }

  for (const eventName of globalEventNames) {
    window.removeEventListener(eventName, requestCheckSizes, eventListenerConfig)
  }
}

function startGlobalMutationObserver() {
  globalMutationObserver.observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true,
  })
}

function stopGlobalMutationObserver() {
  globalMutationObserver.disconnect()
}

function pauseGlobalMutationObserver() {
  if (!globalMutationObserverPaused) {
    globalMutationObserverPaused = true

    if (configMap.size) {
      stopGlobalMutationObserver()
    }
  }
}

function resumeGlobalMutationObserver() {
  if (globalMutationObserverPaused) {
    globalMutationObserverPaused = false

    if (configMap.size) {
      startGlobalMutationObserver()
    }
  }
}

// Preact Integration
// -------------------------------------------------------------------------------------------------

function installPreactHooks() {
  const __rOld = (preactOptions as any).__r || noop
  const __cOld = (preactOptions as any).__c || noop
  let requested = false

  // called before a component renders
  ;(preactOptions as any).__r = function() {
    pauseGlobalMutationObserver()
    __rOld.apply(this, arguments)
  }

  // called after component committed to DOM
  ;(preactOptions as any).__c = function() {
    if (!requested) {
      requested = true
      requestAnimationFrame(() => {
        requestCheckSizesSync()
        resumeGlobalMutationObserver()
        requested = false
      })
    }
    __cOld.apply(this, arguments)
  }
}

// Util
// -------------------------------------------------------------------------------------------------

const noop = () => {} // TODO: use elsewhere

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

// Main
// -------------------------------------------------------------------------------------------------
/*
PRECONDITION: element can only have one listener attached

NOTE: If we ever kill the fallback technique and use ResizeObserver unconditionally with full
border-box support, we no longer need wrappers around the <StickyFooterScrollbar>'s <Scroller>
*/

export type ResizeCallback = (width: number, height: number) => void

let watchSize: (el: HTMLElement, callback: ResizeCallback, client?: boolean) => () => void
let updateSizeSync: () => void

if (resizeObserverEnabled && typeof ResizeObserver !== 'undefined') {
  watchSize = watchSizeNative
  updateSizeSync = noop
} else {
  watchSize = watchSizeFallback
  updateSizeSync = requestCheckSizesSync
  installPreactHooks()
}

export { watchSize, updateSizeSync }

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
