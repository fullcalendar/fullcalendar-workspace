import { translateRect, Rect, intersectRects, applyStyle } from '@fullcalendar/core'
import EnhancedScroller from './EnhancedScroller'

interface ElementGeom {
  elBound: Rect // relative to the canvas origin
  parentBound: Rect // relative to the canvas origin
  textAlign: string // 'left' | 'center' | 'right'
}

/*
TEST a lot x-browser
TEST a lot with removing resource rows
*/
export default class StickyScroller {

  scroller: EnhancedScroller
  els: HTMLElement[] = []
  elGeoms: ElementGeom[]
  viewportWidth: number
  viewportHeight: number

  constructor(scroller: EnhancedScroller) {
    this.scroller = scroller
    scroller.on('scrollEnd', this.assignPositions)
  }

  destroy() {
    this.scroller.off('scrollEnd', this.assignPositions)
  }

  addEls(els: HTMLElement[]) {
    this.els.push(...els)
  }

  resetEls(els: HTMLElement[]) { // TODO: deprecate. use removeEls/addEls instead
    this.els = els
  }

  removeEls(removeEls: HTMLElement[]) {
    let { els, elGeoms } = this

    for (let removalEl of removeEls) {
      let index = els.indexOf(removalEl)

      if (index !== -1) {
        els.splice(index, 1) // remove
        elGeoms.splice(index, 1) // remove
      }
    }
  }

  updateSize() {
    this.queryDom()
    this.assignPositions()
  }

  queryDom() {
    let canvasOrigin = this.scroller.canvas.el.getBoundingClientRect()
    let elGeoms: ElementGeom[] = []

    for (let el of this.els) {
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

    this.elGeoms = elGeoms

    let viewportBound = this.scroller.el.getBoundingClientRect()
    this.viewportWidth = viewportBound.width
    this.viewportHeight = viewportBound.height
  }

  assignPositions = () => {
    let scrollLeft = this.scroller.getScrollLeft()
    let scrollTop = this.scroller.getScrollTop()
    let viewportRect: Rect = { // relative to the topleft corner of the canvas
      left: scrollLeft,
      right: scrollLeft + this.viewportWidth,
      top: scrollTop,
      bottom: scrollTop + this.viewportHeight
    }

    this.els.forEach((el, i) => {
      let geom = this.elGeoms[i]
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
