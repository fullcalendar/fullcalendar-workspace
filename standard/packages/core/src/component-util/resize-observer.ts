import { preactOptions } from '../preact.js'
import { isDimsEqual } from './rendering-misc.js'

const nativeEnabled = true
const nativeBorderBoxEnabled = true
const fallbackTimeout = 100

// Common
// -------------------------------------------------------------------------------------------------

export type SizeCallback = (width: number, height: number) => void
export type DisconnectSize = () => void
export type WatchSize = (el: HTMLElement, callback: SizeCallback, client?: boolean, watchWidth?: boolean, watchHeight?: boolean) => DisconnectSize
export type UpdateSizeSync = () => void

type SizeConfig = { // internal only
  callback: SizeCallback
  client?: boolean // watch and report clientWidth/clientHeight?
  width?: number // only used by fallback technique
  height?: number // only used by fallback technique
  watchWidth: boolean // TODO: use bitwise operations
  watchHeight: boolean // "
}

const configMap = new Map<Element, SizeConfig>()
const afterSizeCallbacks = new Set<() => void>()

let isHandling = false // utilized by both techniques

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

/*
A proper ResizeObserver polyfill would keep checking dimensions until all stabilized,
to detect if a *handler* caused a new element's dimensions to change,
while ignoring changes per-element after the first (to prevent infinite loops),
but our Preact system does not commit to the DOM immediately, commits are batched for later,
so we can skip this.
*/
function checkConfigMap() {
  if (!isHandling) {
    isHandling = true

    const dirtyConfigs: SizeConfig[] = []

    for (const [el, config] of configMap.entries()) {
      let width: number
      let height: number

      if (config.client) {
        width = el.clientWidth
        height = el.clientHeight
      } else {
        ({ width, height } = el.getBoundingClientRect())
      }

      if (storeConfigDims(config, width, height)) {
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

function storeConfigDims(
  config: SizeConfig,
  width: number,
  height: number,
): boolean { // returns whether should fire
  let shouldFire = false

  // we use it because ResizeObserver's results could be slightly off from getBoundingClientRect

  if (!isDimsEqual(config.width, width)) {
    config.width = width
    shouldFire = config.watchWidth
  }

  if (!isDimsEqual(config.height, height)) {
    config.height = height
    shouldFire ||= config.watchHeight
  }

  return shouldFire
}

// Native Technique ONLY
// -------------------------------------------------------------------------------------------------

function initNative(): [WatchSize, UpdateSizeSync] {
  // Single global ResizeObserver does batching and uses less memory than individuals
  // Will always fire with delay after DOM mutation, but before repaint,
  // thus doesn't need !isHandling check like checkConfigMap
  const globalResizeObserver = new ResizeObserver((entries) => {
    isHandling = true

    for (let entry of entries) {
      const el = entry.target
      const config = configMap.get(el)
      let width: number
      let height: number

      if (config.client) {
        width = el.clientWidth
        height = el.clientHeight
      } else if (entry.borderBoxSize && nativeBorderBoxEnabled) {
        const borderBoxSize: any = entry.borderBoxSize[0] || entry.borderBoxSize // HACK for Firefox
        width = borderBoxSize.inlineSize
        height = borderBoxSize.blockSize
      } else {
        ({ width, height } = el.getBoundingClientRect())
      }

      if (storeConfigDims(config, width, height)) {
        config.callback(width, height)
      }
    }

    flushAfterSize()
    isHandling = false
  })

  function watchSize(
    el: HTMLElement,
    callback: SizeCallback,
    client?: boolean,
    watchWidth = true,
    watchHeight = true,
  ) {
    configMap.set(el, { callback, client, watchWidth, watchHeight })

    globalResizeObserver.observe(el, {
      box: !client && nativeBorderBoxEnabled
        ? 'border-box'
        : undefined // default is 'content-box'
    })

    return () => {
      configMap.delete(el)
      globalResizeObserver.unobserve(el)
    }
  }

  return [watchSize, checkConfigMap]
}


// Fallback Technique ONLY
// -------------------------------------------------------------------------------------------------

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

function initFallback(): [WatchSize, UpdateSizeSync] {
  let globalMutationObserver: MutationObserver | undefined // lazily initialize for non-browser envs
  let globalMutationObserverPaused = false

  const [requestCheckSizes, cancelCheckSizes] = debounce(checkConfigMap, fallbackTimeout)

  function requestCheckSizesSync() {
    cancelCheckSizes()
    checkConfigMap()
  }

  function watchSize(
    el: HTMLElement,
    callback: SizeCallback,
    client?: boolean,
    watchWidth = true,
    watchHeight = true,
  ) {
    if (!configMap.size) {
      addGlobalHandlers()
    }

    configMap.set(el, { callback, client, watchWidth, watchHeight })
    requestCheckSizes()

    return () => {
      configMap.delete(el)

      if (!configMap.size) {
        removeGlobalHandlers()
      }
    }
  }

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

  return [watchSize, requestCheckSizesSync]
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

export const [watchSize, updateSizeSync] =
  nativeEnabled && typeof ResizeObserver !== 'undefined'
    ? initNative()
    : initFallback()

// debug
if (!nativeEnabled) {
  (window as any).watchSize = watchSize
}

export function watchWidth(
  el: HTMLElement,
  callback: (width: number) => void,
): DisconnectSize {
  return watchSize(
    el,
    callback,
    /* watchWidth = */ true,
  )
}

export function watchHeight(
  el: HTMLElement,
  callback: (height: number) => void,
): DisconnectSize {
  return watchSize(
    el,
    (_width, height) => callback(height),
    /* watchWidth = */ false,
    /* watchHeight = */ true,
  )
}
