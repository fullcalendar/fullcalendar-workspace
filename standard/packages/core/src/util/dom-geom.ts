import { intersectRects, Rect } from './geom.js'

export interface EdgeInfo {
  borderLeft: number
  borderRight: number
  borderTop: number
  borderBottom: number
  scrollbarLeft: number
  scrollbarRight: number
  scrollbarBottom: number
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
}

export function computeEdges(el: HTMLElement, getPadding = false): EdgeInfo { // cache somehow?
  let computedStyle = window.getComputedStyle(el)
  let borderLeft = parseInt(computedStyle.borderLeftWidth, 10) || 0
  let borderRight = parseInt(computedStyle.borderRightWidth, 10) || 0
  let borderTop = parseInt(computedStyle.borderTopWidth, 10) || 0
  let borderBottom = parseInt(computedStyle.borderBottomWidth, 10) || 0
  let badScrollbarWidths = computeScrollbarWidthsForEl(el) // includes border!
  let scrollbarLeftRight = badScrollbarWidths.y - borderLeft - borderRight
  let scrollbarBottom = badScrollbarWidths.x - borderTop - borderBottom

  let res: EdgeInfo = {
    borderLeft,
    borderRight,
    borderTop,
    borderBottom,
    scrollbarBottom,
    scrollbarLeft: 0,
    scrollbarRight: 0,
  }

  if (computedStyle.direction === 'rtl') {
    res.scrollbarLeft = scrollbarLeftRight
  } else {
    res.scrollbarRight = scrollbarLeftRight
  }

  if (getPadding) {
    res.paddingLeft = parseInt(computedStyle.paddingLeft, 10) || 0
    res.paddingRight = parseInt(computedStyle.paddingRight, 10) || 0
    res.paddingTop = parseInt(computedStyle.paddingTop, 10) || 0
    res.paddingBottom = parseInt(computedStyle.paddingBottom, 10) || 0
  }

  return res
}

export function computeInnerRect(el, goWithinPadding = false, doFromWindowViewport?: boolean) {
  let outerRect = doFromWindowViewport ? el.getBoundingClientRect() : computeRect(el)
  let edges = computeEdges(el, goWithinPadding)
  let res = {
    left: outerRect.left + edges.borderLeft + edges.scrollbarLeft,
    right: outerRect.right - edges.borderRight - edges.scrollbarRight,
    top: outerRect.top + edges.borderTop,
    bottom: outerRect.bottom - edges.borderBottom - edges.scrollbarBottom,
  }

  if (goWithinPadding) {
    res.left += edges.paddingLeft
    res.right -= edges.paddingRight
    res.top += edges.paddingTop
    res.bottom -= edges.paddingBottom
  }

  return res
}

export function computeRect(el): Rect {
  let rect = el.getBoundingClientRect()

  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
    right: rect.right + window.scrollX,
    bottom: rect.bottom + window.scrollY,
  }
}

export function computeClippedClientRect(el: HTMLElement): Rect | null {
  let clippingParents = getClippingParents(el)
  let rect: Rect = el.getBoundingClientRect()

  for (let clippingParent of clippingParents) {
    let intersection = intersectRects(rect, clippingParent.getBoundingClientRect())
    if (intersection) {
      rect = intersection
    } else {
      return null
    }
  }

  return rect
}

export function computeHeightAndMargins(el: HTMLElement) {
  return el.getBoundingClientRect().height + computeVMargins(el)
}

export function computeVMargins(el: HTMLElement) {
  let computed = window.getComputedStyle(el)

  return parseInt(computed.marginTop, 10) +
    parseInt(computed.marginBottom, 10)
}

// does not return window
export function getClippingParents(el: HTMLElement): HTMLElement[] {
  let parents: HTMLElement[] = []

  while (el instanceof HTMLElement) { // will stop when gets to document or null
    let computedStyle = window.getComputedStyle(el)

    if (computedStyle.position === 'fixed') {
      break
    }

    if ((/(auto|scroll)/).test(computedStyle.overflow + computedStyle.overflowY + computedStyle.overflowX)) {
      parents.push(el)
    }

    el = el.parentNode as HTMLElement
  }

  return parents
}

interface ScrollbarWidths {
  x: number
  y: number // TODO: rename to vertical. less confusing when dealing with width/height verbage
}

// WARNING: will include border
function computeScrollbarWidthsForEl(el: HTMLElement): ScrollbarWidths {
  return {
    x: el.offsetHeight - el.clientHeight,
    y: el.offsetWidth - el.clientWidth,
  }
}
