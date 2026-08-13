import { flushSync } from 'react-dom'
import { isDimsEqual } from './rendering-misc'

const nativeBorderBoxEnabled = true

// Common
// -------------------------------------------------------------------------------------------------

export type SizeCallback = (width: number, height: number) => void
export type DisconnectSize = () => void

type SizeConfig = { // internal only
  callback: SizeCallback
  width?: number // HACK: internal storage
  height?: number // HACK: internal storage
  watchWidth: boolean // TODO: use bitwise operations
  watchHeight: boolean // "
}

const configMap = new Map<Element, SizeConfig>()
const afterSizeCallbacks = new Set<() => void>()

let isHandling = false
let isStalling = false

export function afterSize(callback: () => void) {
  afterSizeCallbacks.add(callback)

  // batch & then flush when not within ResizeObserver handler loop
  // happens for watchers that die and report `null` as dimension
  if (!isHandling && !isStalling) {
    isStalling = true
    requestAnimationFrame(() => {
      isStalling = false
      flushAfterSize()
    })
  }
}

function flushAfterSize() {
  for (const flushedCallback of afterSizeCallbacks.values()) {
    flushedCallback()
    afterSizeCallbacks.delete(flushedCallback)
  }
}

// Native
// -------------------------------------------------------------------------------------------------

// Single global ResizeObserver does batching and uses less memory than individuals
// Will always fire with delay after DOM mutation, but before repaint,
// thus doesn't need !isHandling check like checkConfigMap
const globalResizeObserver = typeof ResizeObserver !== 'undefined' && new ResizeObserver((entries) => {
  isHandling = true

  // // debug
  // console.log('RESIZE-OBSERVER', entries.map((entry) => entry.target))

  for (let entry of entries) {
    const el = entry.target
    const config = configMap.get(el)
    let width: number
    let height: number

    if (entry.borderBoxSize && nativeBorderBoxEnabled) {
      const borderBoxSize: any = entry.borderBoxSize[0] || entry.borderBoxSize // HACK for Firefox
      width = borderBoxSize.inlineSize
      height = borderBoxSize.blockSize
    } else {
      ({ width, height } = el.getBoundingClientRect())
    }

    let shouldFire = false
    if (!isDimsEqual(config.width, width)) {
      config.width = width
      shouldFire = config.watchWidth
    }
    if (!isDimsEqual(config.height, height)) {
      config.height = height
      shouldFire ||= config.watchHeight
    }
    if (shouldFire) {
      config.callback(width, height)
    }
  }

  flushSync(() => {
    flushAfterSize()
    isHandling = false
  })
})

/*
PRECONDITION: element can only have one listener attached
*/
export function watchSize(
  el: HTMLElement,
  callback: SizeCallback,
  watchWidth = true,
  watchHeight = true,
): DisconnectSize {
  return watchSizeInternal(el, callback, watchWidth, watchHeight, false)
}

/**
 * Watches an element after synchronously acquiring its current dimensions.
 *
 * The callback runs before registration returns; later size changes still
 * arrive through the shared border-box ResizeObserver.
 *
 * `getBoundingClientRect()` includes transforms while ResizeObserver's
 * border-box does not. That distinction is acceptable for print-only DOM.
 *
 * Calling this directly from a class component's mount/ref lifecycle is a
 * workaround for the lack of hooks. Once components go functional, direct
 * call sites give way to a `useElementSize`-style hook whose `useLayoutEffect`
 * performs this same imperative acquire-then-observe internally.
 */
export function watchSizeImmediate(
  el: HTMLElement,
  callback: SizeCallback,
  watchWidth = true,
  watchHeight = true,
): DisconnectSize {
  return watchSizeInternal(el, callback, watchWidth, watchHeight, true)
}

function watchSizeInternal(
  el: HTMLElement,
  callback: SizeCallback,
  watchWidth: boolean,
  watchHeight: boolean,
  immediate: boolean,
): DisconnectSize {
  const config: SizeConfig = { callback, watchWidth, watchHeight }
  configMap.set(el, config)

  if (immediate) {
    const { width, height } = el.getBoundingClientRect()
    config.width = width
    config.height = height

    // Drain afterSize work synchronously before registration returns unless
    // an outer ResizeObserver batch already owns that drain.
    const wasHandling = isHandling
    isHandling = true
    try {
      callback(width, height)
    } finally {
      isHandling = wasHandling
    }
    if (!wasHandling) {
      flushAfterSize()
    }
  }

  // if statement is for jsdom and other shim environments that execute component effects, but
  // haven't implemented ResizeObserver. Reference: https://github.com/jsdom/jsdom/issues/3368
  if (globalResizeObserver) {
    globalResizeObserver.observe(el, {
      box: nativeBorderBoxEnabled
        ? 'border-box'
        : undefined // default is 'content-box'
    })
  }

  return () => {
    configMap.delete(el)

    // same reasoning as above
    if (globalResizeObserver) {
      globalResizeObserver.unobserve(el)
    }
  }
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

export function watchHeightImmediate(
  el: HTMLElement,
  callback: (height: number) => void,
): DisconnectSize {
  return watchSizeImmediate(
    el,
    (_width, height) => callback(height),
    /* watchWidth = */ false,
    /* watchHeight = */ true,
  )
}
