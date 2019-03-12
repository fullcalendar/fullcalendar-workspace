import { translateRect, Rect, applyStyle } from '@fullcalendar/core'
import EnhancedScroller from './EnhancedScroller'

interface ElementGeom {
  parentBound: Rect // relative to the canvas origin
  elWidth: number
  elHeight: number
  intendedTextAlign: string
  actualTextAlign: string
}

const SUPPORTS_STICKY = computeSupportsSticky()
const STICKY_CLASSNAME = 'fc-sticky'
const STICKY_ACTIVE_CLASSNAME = 'fc-sticky-active'

/*
TEST a lot x-browser
TEST a lot with removing resource rows

useful beyond the native position:sticky for these reasons:
- className when active
- support in IE11
- nice centering support
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
    let els = Array.prototype.slice.call(this.scroller.canvas.el.querySelectorAll('.' + STICKY_CLASSNAME))
    let elGeoms = this.queryElGeom(els)
    let viewportBound = this.scroller.el.getBoundingClientRect()
    this.assignPositions(els, elGeoms, viewportBound.width, viewportBound.height)
  }

  queryElGeom(els: HTMLElement[]): ElementGeom[] {
    let canvasOrigin = this.scroller.canvas.el.getBoundingClientRect()
    let elGeoms: ElementGeom[] = []

    for (let el of els) {

      let parentBound = translateRect(
        (el.parentNode as HTMLElement).getBoundingClientRect(),
        -canvasOrigin.left,
        -canvasOrigin.top
      )

      let elRect = el.getBoundingClientRect()
      let computedTextAlign = window.getComputedStyle(el.parentNode as HTMLElement).textAlign

      elGeoms.push({
        parentBound,
        elWidth: elRect.width,
        elHeight: elRect.height,
        actualTextAlign: computedTextAlign,
        intendedTextAlign: el.getAttribute('data-sticky-align') || computedTextAlign
      })
    }

    return elGeoms
  }

  assignPositions(els: HTMLElement[], elGeoms: ElementGeom[], viewportWidth: number, viewportHeight: number) {

    // an intense read operation. do this in updateSize instead
    let scrollLeft = this.scroller.getScrollFromLeft()
    let scrollTop = this.scroller.getScrollTop()

    let viewportRect: Rect = { // relative to the topleft corner of the canvas
      left: scrollLeft,
      right: scrollLeft + viewportWidth,
      top: scrollTop,
      bottom: scrollTop + viewportHeight
    }

    els.forEach((el, i) => {
      let geom = elGeoms[i]
      let { elWidth, elHeight, parentBound } = geom
      let destLeft // relative to canvas topleft
      let destTop // "
      let naturalLeft

      switch (geom.intendedTextAlign) {
        case 'left':
          destLeft = viewportRect.left
          naturalLeft = parentBound.left
          break
        case 'right':
          destLeft = viewportRect.right - elWidth
          naturalLeft = parentBound.left - elWidth
          break
        case 'center':
          destLeft = (viewportRect.left + viewportRect.right) / 2 - elWidth / 2
          naturalLeft = destLeft // ?
          break
      }

      destLeft = Math.max(destLeft, parentBound.left)
      destLeft = Math.min(destLeft, parentBound.right - elWidth)

      destTop = viewportRect.top
      destTop = Math.max(destTop, parentBound.top)
      destTop = Math.min(destTop, parentBound.bottom - elHeight)

      let isStickyActive =
        naturalLeft < viewportRect.left ||
        naturalLeft + elWidth >= viewportRect.right ||
        parentBound.top < viewportRect.top

      // relative to parent
      let relLeft = destLeft - parentBound.left
      let relTop = destTop - parentBound.top

      if (geom.actualTextAlign !== 'left') {
        ;(el.parentNode as HTMLElement).style.textAlign = 'left'
        el.setAttribute('data-sticky-align', geom.intendedTextAlign) // for next time
      }

      applyStyle(el, {
        position: 'relative',
        left: Math.max(relLeft, 0), // in case off-by-one because of border
        top: Math.max(relTop, 0) // "
      })

      if (isStickyActive) {
        el.classList.add(STICKY_ACTIVE_CLASSNAME)
      } else {
        el.classList.remove(STICKY_ACTIVE_CLASSNAME)
      }
    })
  }

}

function computeSupportsSticky() {
  let div = document.createElement('div')
  div.style.position = 'sticky'
  return div.style.position === 'sticky'
}
