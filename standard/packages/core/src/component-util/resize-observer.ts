
type ResizeCallback = (w: number, h: number) => void

const callbackMap = new Map<Element, ResizeCallback>()
let flushedCallbackSet = new Set<() => void>()
let isHandling = false

/*
Performant from multiple perspectives:
- less memory with one ResizeObserver
- batches firing
*/
const resizeObserver = new ResizeObserver((entries) => {
  isHandling = true

  for (let entry of entries) {
    const callback = callbackMap.get(entry.target)

    if (entry.borderBoxSize) {
      callback(entry.borderBoxSize[0].inlineSize, entry.borderBoxSize[0].blockSize)
    } else {
      const rect = entry.target.getBoundingClientRect()
      callback(rect.width, rect.height)
    }
  }

  for (const flushedCallback of flushedCallbackSet.values()) {
    flushedCallback()
    flushedCallbackSet.delete(flushedCallback)
  }

  isHandling = false
})

/*
PRECONDITIONS:
- element can only have one listener attached ever

If we every kill the ponyfill and use ResizeObserver unconditionally with full border-box support,
we no longer need wrappers around the <StickyFooterScrollbar>'s <Scroller>
*/
export function watchSize(
  el: HTMLElement,
  callback: ResizeCallback,
  watchContentBox?: boolean,
) {
  callbackMap.set(el, callback)
  resizeObserver.observe(el, {
    box: watchContentBox ? undefined : 'border-box',
  })

  return () => {
    callbackMap.delete(el)
    resizeObserver.unobserve(el)
  }
}

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

export function afterSize(callback: () => void) {
  if (isHandling) {
    flushedCallbackSet.add(callback)
  } else {
    callback() // TODO: should we queue microtask?
  }
}
