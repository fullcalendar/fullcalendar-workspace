
export function watchSize(
  el: HTMLElement,
  callback: (width: number, height: number) => void,
) {
  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
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
  });

  resizeObserver.observe(el)

  return () => {
    resizeObserver.disconnect()
  }
}

export function watchWidth(
  el: HTMLElement,
  callback: (height: number) => void,
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
