import { createElement, computeEdges, applyStyle, ScrollbarWidths, ScrollerProps, Component, renderer } from '@fullcalendar/core'
import EnhancedScroller from './EnhancedScroller'

/*
A Scroller, but with a wrapping div that allows "clipping" away of native scrollbars,
giving the appearance that there are no scrollbars.
*/
export default class ClippedScroller extends Component<ScrollerProps> {

  clipEl = createElement('div', { className: 'fc-scroller-clip' })
  renderEnhancedScroller = renderer(EnhancedScroller)
  enhancedScroller: EnhancedScroller

  isHScrollbarsClipped: boolean
  isVScrollbarsClipped: boolean


  /*
  Received overflows can be set to 'clipped', meaning scrollbars shouldn't be visible
  to the user, but the area should still scroll.
  */
  render(props: ScrollerProps) {
    let overflowX = props.overflowX
    let overflowY = props.overflowY

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

    this.enhancedScroller = this.renderEnhancedScroller({
      parentEl: this.clipEl,
      overflowX,
      overflowY
    })

    return this.clipEl
  }


  updateSize() {
    let enhancedScroller = this.renderEnhancedScroller.current
    let scrollEl = enhancedScroller.getEl()
    let edges = computeEdges(scrollEl)
    let cssProps = { marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 0 }

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
      (this.isHScrollbarsClipped || (enhancedScroller.props.overflowX === 'hidden')) && // should never show?
      (this.isVScrollbarsClipped || (enhancedScroller.props.overflowY === 'hidden')) && // should never show?
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
    let enhancedScroller = this.renderEnhancedScroller.current
    enhancedScroller.scroller.setHeight(height)
  }

  /*
  Accounts for 'clipped' scrollbars
  */
  getScrollbarWidths(): ScrollbarWidths {
    let enhancedScroller = this.renderEnhancedScroller.current
    let widths = enhancedScroller.scroller.getScrollbarWidths()

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
