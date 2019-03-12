import { translateRect, Rect, applyStyle, Point } from '@fullcalendar/core'
import EnhancedScroller from './EnhancedScroller'

interface ElementGeom {
  parentBound: Rect // relative to the canvas origin
  naturalBound: Rect | null // of the el itself
  elWidth: number
  elHeight: number
  computedTextAlign: string
  intendedTextAlign: string
}

const STICKY_SUPPORTED = computeSupportsSticky()
const IS_MS_EDGE = /Edge/.test(navigator.userAgent)
const STICKY_CLASSNAME = 'fc-sticky'

/*
useful beyond the native position:sticky for these reasons:
- support in IE11
- nice centering support
*/
export default class StickyScroller {

  usingRelative: boolean
  scroller: EnhancedScroller

  constructor(scroller: EnhancedScroller, isRtl: boolean, isVertical: boolean) {
    this.scroller = scroller

    this.usingRelative =
      !STICKY_SUPPORTED || // IE11
      (IS_MS_EDGE && ( // bugs for MSEdge...
        isRtl || // because https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/18883305/
        isVertical // because doesn't work with rowspan in tables, our only vertial use
      ))

    if (this.usingRelative) {
      scroller.on('scrollEnd', this.updateSize)
    }
  }

  destroy() {
    this.scroller.off('scrollEnd', this.updateSize)
  }

  /*
  known bug: called twice on init. problem when mixing with ScrollJoiner
  */
  updateSize = () => {
    let els = Array.prototype.slice.call(this.scroller.canvas.el.querySelectorAll('.' + STICKY_CLASSNAME))
    let elGeoms = this.queryElGeoms(els)
    let viewportWidth = this.scroller.el.clientWidth

    if (this.usingRelative) {
      let elDestinations = this.computeElDestinations(elGeoms, viewportWidth) // read before prepPositioning
      assignRelativePositions(els, elGeoms, elDestinations)
    } else {
      assignStickyPositions(els, elGeoms, viewportWidth)
    }
  }

  queryElGeoms(els: HTMLElement[]): ElementGeom[] {
    let canvasOrigin = this.scroller.canvas.el.getBoundingClientRect()
    let elGeoms: ElementGeom[] = []

    for (let el of els) {

      let parentBound = translateRect(
        (el.parentNode as HTMLElement).getBoundingClientRect(),
        -canvasOrigin.left,
        -canvasOrigin.top
      )

      let elRect = el.getBoundingClientRect()
      let computedStyles = window.getComputedStyle(el)
      let computedTextAlign = window.getComputedStyle(el.parentNode as HTMLElement).textAlign // ask the parent
      let intendedTextAlign = computedTextAlign
      let naturalBound = null

      if (computedStyles.position !== 'sticky') {
        naturalBound = translateRect(
          elRect,
          -canvasOrigin.left - (parseFloat(computedStyles.left) || 0), // could be 'auto'
          -canvasOrigin.top - (parseFloat(computedStyles.top) || 0)
        )
      }

      if (el.hasAttribute('data-sticky-center')) {
        intendedTextAlign = 'center'
      }

      elGeoms.push({
        parentBound,
        naturalBound,
        elWidth: elRect.width,
        elHeight: elRect.height,
        computedTextAlign,
        intendedTextAlign
      })
    }

    return elGeoms
  }

  computeElDestinations(elGeoms: ElementGeom[], viewportWidth: number): Point[] {
    let viewportLeft = this.scroller.getScrollFromLeft()
    let viewportTop = this.scroller.getScrollTop()
    let viewportRight = viewportLeft + viewportWidth

    return elGeoms.map(function(elGeom) {
      let { elWidth, elHeight, parentBound, naturalBound } = elGeom
      let destLeft // relative to canvas topleft
      let destTop // "

      switch (elGeom.intendedTextAlign) {
        case 'left':
          destLeft = viewportLeft
          break
        case 'right':
          destLeft = viewportRight - elWidth
          break
        case 'center':
          destLeft = (viewportLeft + viewportRight) / 2 - elWidth / 2
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

function assignRelativePositions(els: HTMLElement[], elGeoms: ElementGeom[], elDestinations: Point[]) {
  els.forEach(function(el, i) {
    let { naturalBound } = elGeoms[i]

    applyStyle(el, {
      position: 'relative',
      left: elDestinations[i].left - naturalBound.left,
      top: elDestinations[i].top - naturalBound.top
    })
  })
}

function assignStickyPositions(els: HTMLElement[], elGeoms: ElementGeom[], viewportWidth: number) {
  els.forEach(function(el, i) {
    let stickyLeft = 0

    if (elGeoms[i].intendedTextAlign === 'center') {
      stickyLeft = (viewportWidth - elGeoms[i].elWidth) / 2

      // needs to be forced to left?
      if (elGeoms[i].computedTextAlign === 'center') {
        el.setAttribute('data-sticky-center', '') // remember for next queryElGeoms
        ;(el.parentNode as HTMLElement).style.textAlign = 'left'
      }
    }

    applyStyle(el, {
      position: 'sticky',
      left: stickyLeft,
      right: 0,
      top: 0
    })
  })
}

function computeSupportsSticky() {
  let div = document.createElement('div')
  div.style.position = 'sticky'
  return div.style.position === 'sticky'
}
