import {
  applyStyle,
  translateRect, Rect, Point,
  findElements,
  computeInnerRect,
  CssDimValue,
  removeElement,
} from '@fullcalendar/common'
import { ScrollListener } from './ScrollListener'
import { getScrollCanvasOrigin, getScrollFromLeftEdge } from './scroll-left-norm'

interface ElementGeom {
  parentBound: Rect // relative to the canvas origin
  naturalBound: Rect | null // of the el itself
  elWidth: number
  elHeight: number
  textAlign: string
}

const IS_MS_EDGE = typeof navigator !== 'undefined' && /Edge/.test(navigator.userAgent) // TODO: what about Chromeum-based Edge?
const STICKY_SELECTOR = '.fc-sticky'

/*
useful beyond the native position:sticky for these reasons:
- support in IE11
- nice centering support

REQUIREMENT: fc-sticky elements, if the fc-sticky className is taken away, should NOT have relative or absolute positioning.
This is because we attach the coords with JS, and the VDOM might take away the fc-sticky class but doesn't know kill the positioning.

TODO: don't query text-align:center. isn't compatible with flexbox centering. instead, check natural X coord within parent container
*/
export class StickyScrolling {
  listener?: ScrollListener
  usingRelative: boolean | null = null

  constructor(
    private scrollEl: HTMLElement,
    private isRtl: boolean,
  ) {
    this.usingRelative =
      !getStickySupported() || // IE11
      // https://stackoverflow.com/questions/56835658/in-microsoft-edge-sticky-positioning-doesnt-work-when-combined-with-dir-rtl
      (IS_MS_EDGE && isRtl)

    if (this.usingRelative) {
      this.listener = new ScrollListener(scrollEl)
      this.listener.emitter.on('scrollEnd', this.updateSize)
    }
  }

  destroy() {
    if (this.listener) {
      this.listener.destroy()
    }
  }

  updateSize = () => {
    let { scrollEl } = this
    let els = findElements(scrollEl, STICKY_SELECTOR)
    let elGeoms = this.queryElGeoms(els)
    let viewportWidth = scrollEl.clientWidth
    let viewportHeight = scrollEl.clientHeight

    if (this.usingRelative) {
      let elDestinations = this.computeElDestinations(elGeoms, viewportWidth) // read before prepPositioning

      assignRelativePositions(els, elGeoms, elDestinations, viewportWidth, viewportHeight)
    } else {
      assignStickyPositions(els, elGeoms, viewportWidth)
    }
  }

  queryElGeoms(els: HTMLElement[]): ElementGeom[] {
    let { scrollEl, isRtl } = this
    let canvasOrigin = getScrollCanvasOrigin(scrollEl)
    let elGeoms: ElementGeom[] = []

    for (let el of els) {
      let parentBound = translateRect(
        computeInnerRect(el.parentNode as HTMLElement, true, true), // weird way to call this!!!
        -canvasOrigin.left,
        -canvasOrigin.top,
      )

      let elRect = el.getBoundingClientRect()
      let computedStyles = window.getComputedStyle(el)
      let textAlign = window.getComputedStyle(el.parentNode as HTMLElement).textAlign // ask the parent
      let naturalBound = null

      if (textAlign === 'start') {
        textAlign = isRtl ? 'right' : 'left'
      } else if (textAlign === 'end') {
        textAlign = isRtl ? 'left' : 'right'
      }

      if (computedStyles.position !== 'sticky') {
        naturalBound = translateRect(
          elRect,
          -canvasOrigin.left - (parseFloat(computedStyles.left) || 0), // could be 'auto'
          -canvasOrigin.top - (parseFloat(computedStyles.top) || 0),
        )
      }

      elGeoms.push({
        parentBound,
        naturalBound,
        elWidth: elRect.width,
        elHeight: elRect.height,
        textAlign,
      })
    }

    return elGeoms
  }

  // only for IE
  computeElDestinations(elGeoms: ElementGeom[], viewportWidth: number): Point[] {
    let { scrollEl } = this
    let viewportTop = scrollEl.scrollTop
    let viewportLeft = getScrollFromLeftEdge(scrollEl)
    let viewportRight = viewportLeft + viewportWidth

    return elGeoms.map((elGeom) => {
      let { elWidth, elHeight, parentBound, naturalBound } = elGeom
      let destLeft // relative to canvas topleft
      let destTop // "

      switch (elGeom.textAlign) {
        case 'left':
          destLeft = viewportLeft
          break
        case 'right':
          destLeft = viewportRight - elWidth
          break
        case 'center':
          destLeft = (viewportLeft + viewportRight) / 2 - elWidth / 2 /// noooo, use half-width insteadddddddd
          break
      }

      destLeft = Math.min(destLeft, parentBound.right - elWidth)
      destLeft = Math.max(destLeft, parentBound.left)

      destTop = viewportTop
      destTop = Math.min(destTop, parentBound.bottom - elHeight)
      destTop = Math.max(destTop, naturalBound.top) // better to use natural top for upper bound

      return { left: destLeft, top: destTop }
    })
  }
}

function assignRelativePositions(
  els: HTMLElement[],
  elGeoms: ElementGeom[],
  elDestinations: Point[],
  viewportWidth: number,
  viewportHeight: number,
) {
  els.forEach((el, i) => {
    let { naturalBound, parentBound } = elGeoms[i]
    let parentWidth = parentBound.right - parentBound.left
    let parentHeight = parentBound.bottom - parentBound.bottom
    let left: CssDimValue
    let top: CssDimValue

    if (
      parentWidth > viewportWidth ||
      parentHeight > viewportHeight
    ) {
      left = elDestinations[i].left - naturalBound.left
      top = elDestinations[i].top - naturalBound.top
    } else { // if parent container can be completely in view, we don't need stickiness
      left = ''
      top = ''
    }

    applyStyle(el, {
      position: 'relative',
      left,
      right: -left, // for rtl
      top,
    })
  })
}

function assignStickyPositions(els: HTMLElement[], elGeoms: ElementGeom[], viewportWidth: number) {
  els.forEach((el, i) => {
    let { textAlign, elWidth, parentBound } = elGeoms[i]
    let parentWidth = parentBound.right - parentBound.left
    let left: CssDimValue

    if (
      textAlign === 'center' &&
      parentWidth > viewportWidth
    ) {
      left = (viewportWidth - elWidth) / 2
    } else { // if parent container can be completely in view, we don't need stickiness
      left = ''
    }

    applyStyle(el, { // will already have fc-sticky class which makes it sticky
      left,
      right: left, // for when centered
      top: 0,
    })
  })
}

let _isStickySupported

function getStickySupported() {
  if (_isStickySupported == null) {
    _isStickySupported = computeStickySupported()
  }
  return _isStickySupported
}

function computeStickySupported() {
  let el = document.createElement('div')
  el.style.position = 'sticky'
  document.body.appendChild(el)
  let val = window.getComputedStyle(el).position
  removeElement(el)
  return val === 'sticky'
}
