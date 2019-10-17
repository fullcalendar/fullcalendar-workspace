import { createElement, computeEdges, applyStyle, ScrollbarWidths, removeElement } from '@fullcalendar/core'
import EnhancedScroller from './EnhancedScroller'

/*
A Scroller, but with a wrapping div that allows "clipping" away of native scrollbars,
giving the appearance that there are no scrollbars.
*/
export default class ClippedScroller {

  el: HTMLElement
  enhancedScroll: EnhancedScroller
  isHScrollbarsClipped: boolean
  isVScrollbarsClipped: boolean


  /*
  Received overflows can be set to 'clipped', meaning scrollbars shouldn't be visible
  to the user, but the area should still scroll.
  */
  constructor(overflowX: string, overflowY: string, parentEl: HTMLElement) {

    this.isHScrollbarsClipped = false
    this.isVScrollbarsClipped = false

    if (overflowX === 'clipped-scroll') {
      overflowX = 'scroll'
      this.isHScrollbarsClipped = true
    }

    if (overflowY === 'clipped-scroll') {
      overflowY = 'scroll'
      this.isVScrollbarsClipped = true
    }

    this.enhancedScroll = new EnhancedScroller(overflowX, overflowY)

    parentEl.appendChild(
      this.el = createElement('div', {
        className: 'fc-scroller-clip'
      })
    )

    this.el.appendChild(this.enhancedScroll.el)
  }

  destroy() {
    removeElement(this.el)
  }

  updateSize() {
    const { enhancedScroll } = this
    const scrollEl = enhancedScroll.el
    const edges = computeEdges(scrollEl)
    const cssProps = { marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 0 }

    // give the inner scrolling div negative margins so that its scrollbars
    // are nudged outside of the bounding box of the wrapper, which is overflow:hidden
    if (this.isVScrollbarsClipped) {
      cssProps.marginLeft = -edges.scrollbarLeft
      cssProps.marginRight = -edges.scrollbarRight
    }
    if (this.isHScrollbarsClipped) {
      cssProps.marginBottom = -edges.scrollbarBottom
    }

    applyStyle(scrollEl, cssProps)

    // if we are attempting to hide the scrollbars offscreen, OSX/iOS will still
    // display the floating scrollbars. attach a className to force-hide them.
    if (
      (this.isHScrollbarsClipped || (enhancedScroll.overflowX === 'hidden')) && // should never show?
      (this.isVScrollbarsClipped || (enhancedScroll.overflowY === 'hidden')) && // should never show?
      !( // doesn't have any scrollbar mass
        edges.scrollbarLeft ||
        edges.scrollbarRight ||
        edges.scrollbarBottom
      )
    ) {
      scrollEl.classList.add('fc-no-scrollbars')
    } else {
      scrollEl.classList.remove('fc-no-scrollbars')
    }
  }

  setHeight(height: number | string) {
    this.enhancedScroll.setHeight(height)
  }

  /*
  Accounts for 'clipped' scrollbars
  */
  getScrollbarWidths(): ScrollbarWidths {
    const widths = this.enhancedScroll.getScrollbarWidths()

    if (this.isVScrollbarsClipped) {
      widths.left = 0
      widths.right = 0
    }

    if (this.isHScrollbarsClipped) {
      widths.bottom = 0
    }

    return widths
  }

}
