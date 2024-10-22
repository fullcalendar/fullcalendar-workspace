
type ResizeCallback = (w: number, h: number) => void
type ResizeConfig = [
  callback: ResizeCallback,
  watchContentBox?: boolean,
]

const configMap = new Map<Element, ResizeConfig>()
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
    const [callback, watchContentBox] = configMap.get(entry.target)

    if (watchContentBox) {
      if (entry.contentBoxSize) {
        // old versions of Firefox treat it as a single item. normalize
        const box = entry.contentBoxSize[0] || (entry.contentBoxSize as any as ResizeObserverSize)

        callback(box.inlineSize, box.blockSize)
      } else {
        // legacy contentRect
        callback(entry.contentRect.width, entry.contentRect.height)
      }
    } else if (entry.borderBoxSize) {
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
- element cannot have border or padding

TODO:
- always force border/padding on these elements to `0 !important` ???
*/
export function watchSize(
  el: HTMLElement,
  callback: ResizeCallback,
  watchContentBox?: boolean,
) {
  configMap.set(el, [callback, watchContentBox])
  resizeObserver.observe(el, {
    box: watchContentBox ? undefined : 'border-box',
  })

  return () => {
    configMap.delete(el)
    resizeObserver.unobserve(el)
  }
}

export function watchWidth(
  el: HTMLElement,
  callback: (width: number) => void,
  watchContentBox?: boolean,
) {
  let currentWidth: number | undefined

  return watchSize(el, (width) => {
    if (currentWidth == null || currentWidth !== width) {
      callback(currentWidth = width)
    }
  }, watchContentBox)
}

export function watchHeight(
  el: HTMLElement,
  callback: (height: number) => void,
  watchContentBox?: boolean,
) {
  let currentHeight: number | undefined

  return watchSize(el, (_width, height) => {
    if (currentHeight == null || currentHeight !== height) {
      callback(currentHeight = height)
    }
  }, watchContentBox)
}

export function afterSize(callback: () => void) {
  if (isHandling) {
    flushedCallbackSet.add(callback)
  } else {
    callback() // TODO: should we queue microtask?
  }
}
