import { translateRect, Rect, intersectRects, applyStyle } from '@fullcalendar/core'
import EnhancedScroller from './EnhancedScroller'

interface ElementGeom {
  elBound: Rect // relative to the canvas origin
  parentBound: Rect // relative to the canvas origin
  textAlign: string // 'left' | 'center' | 'right'
}

const SUPPORTS_STICKY = computeSupportsSticky()
const STICKY_SELECTOR = '.fc-sticky'

/*
TEST a lot x-browser
TEST a lot with removing resource rows
*/
export default class StickyScroller {

  scroller: EnhancedScroller

  constructor(scroller: EnhancedScroller) {
    this.scroller = scroller
    scroller.on('scrollEnd', this.updateSize)
  }

  destroy() {
    this.scroller.off('scrollEnd', this.updateSize)
  }

  updateSize = () => {
    let els = Array.prototype.slice.call(this.scroller.canvas.el.querySelectorAll(STICKY_SELECTOR))
    let elGeoms = this.queryElGeom(els)
    let viewportBound = this.scroller.el.getBoundingClientRect()
    this.assignPositions(els, elGeoms, viewportBound.width, viewportBound.height)
  }

  queryElGeom(els: HTMLElement[]): ElementGeom[] {
    let canvasOrigin = this.scroller.canvas.el.getBoundingClientRect()
    let elGeoms: ElementGeom[] = []

    for (let el of els) {
      let computedStyles = window.getComputedStyle(el)

      let parentBound = translateRect(
        (el.parentNode as HTMLElement).getBoundingClientRect(),
        -canvasOrigin.left,
        -canvasOrigin.top
      )

      let elBound = translateRect(
        el.getBoundingClientRect(),
        -canvasOrigin.left - (parseFloat(computedStyles.left) || 0), // might be 'auto'
        -canvasOrigin.top - (parseFloat(computedStyles.top) || 0)
      )

      elGeoms.push({
        parentBound,
        elBound,
        textAlign: computedStyles.textAlign
      })
    }

    return elGeoms
  }

  assignPositions(els: HTMLElement[], elGeoms: ElementGeom[], viewportWidth: number, viewportHeight: number) {
    let scrollLeft = this.scroller.getScrollLeft()
    let scrollTop = this.scroller.getScrollTop()
    let viewportRect: Rect = { // relative to the topleft corner of the canvas
      left: scrollLeft,
      right: scrollLeft + viewportWidth,
      top: scrollTop,
      bottom: scrollTop + viewportHeight
    }

    els.forEach((el, i) => {
      let geom = elGeoms[i]
      let { elBound, parentBound } = geom
      let clippedParentBound = intersectRects(parentBound, viewportRect) || viewportRect // OR for when completely offscreen
      let elWidth = elBound.right - elBound.left
      let elHeight = elBound.bottom - elBound.top
      let destLeft
      let destTop

      switch (geom.textAlign) {
        case 'left':
          destLeft = clippedParentBound.left
          break
        case 'right':
          destLeft = clippedParentBound.right - elWidth
          break
        case 'center':
          destLeft = (clippedParentBound.left + clippedParentBound.right) / 2 - elWidth / 2
          break
      }

      destLeft = Math.min(destLeft, parentBound.right - elWidth)
      destLeft = Math.max(destLeft, parentBound.left)

      destTop = clippedParentBound.top
      destTop = Math.max(destTop, elBound.top) // the natural top of the element. better than parentBound.top
      destTop = Math.min(destTop, parentBound.bottom - elHeight)

      let relLeft = destLeft - elBound.left
      let relTop = destTop - elBound.top

      if (relTop || relLeft) {
        applyStyle(el, {
          position: 'relative',
          left: relLeft,
          top: relTop
        })
      } else {
        applyStyle(el, {
          position: '',
          left: '',
          top: ''
        })
      }
    })
  }

}

function computeSupportsSticky() {
  let div = document.createElement('div')
  div.style.position = 'sticky'
  return div.style.position === 'sticky'
}
