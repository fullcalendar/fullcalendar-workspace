
const callbackMap = new Map<Element, (w: number, h: number) => void>()
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

    if (entry.contentBoxSize) {
      // The standard makes contentBoxSize an array...
      if (entry.contentBoxSize[0]) {
        callback(entry.contentBoxSize[0].inlineSize, entry.contentBoxSize[0].blockSize)
      } else {
        // ...but old versions of Firefox treat it as a single item
        callback((entry.contentBoxSize as any).inlineSize, (entry.contentBoxSize as any).blockSize)
      }
    } else {
      callback(entry.contentRect.width, entry.contentRect.height)
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
- element cannot have border or padding

TODO:
- always force border/padding on these elements to `0 !important` ???
*/
export function watchSize(
  el: HTMLElement,
  callback: (width: number, height: number) => void,
) {
  callbackMap.set(el, callback)
  resizeObserver.observe(el)

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
