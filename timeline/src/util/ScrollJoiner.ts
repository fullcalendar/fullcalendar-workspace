import { SubRenderer, isArraysEqual } from '@fullcalendar/core'
import ClippedScroller from './ClippedScroller'

export interface ScrollJoinerProps {
  axis: any
  scrollers: ClippedScroller[]
}

export default class ScrollJoiner extends SubRenderer<ScrollJoinerProps> {

  private masterScroller: ClippedScroller
  private destroys: (() => void)[] = []


  render(props: ScrollJoinerProps) {
    for (let scroller of props.scrollers) {
      this.initScroller(scroller)
    }
  }


  unrender() {
    for (let destroy of this.destroys) {
      destroy()
    }

    this.destroys = []
  }


  initScroller(scroller: ClippedScroller) {
    let enhancedScroller = scroller.enhancedScroller

    // when the user scrolls via mousewheel, we know for sure the target
    // scroller should be the master. capture the various x-browser events that fire.
    const onWheel = () => {
      this.assignMasterScroller(scroller)
    }
    'wheel mousewheel DomMouseScroll MozMousePixelScroll'.split(' ').forEach((evName) => {
      enhancedScroller.rootEl.addEventListener(evName, onWheel)
    })

    const onScrollStart = () => {
      if (!this.masterScroller) {
        this.assignMasterScroller(scroller)
      }
    }

    const onScroll = () => {
      if (scroller === this.masterScroller) {
        for (let otherScroller of this.props.scrollers) {
          if (otherScroller !== scroller) {
            switch (this.props.axis) {
              case 'horizontal':
                otherScroller.enhancedScroller.rootEl.scrollLeft = enhancedScroller.rootEl.scrollLeft
                break
              case 'vertical':
                otherScroller.enhancedScroller.scroller.controller.setScrollTop(enhancedScroller.scroller.controller.getScrollTop())
                break
            }
          }
        }
      }
    }

    const onScrollEnd = () => {
      if (scroller === this.masterScroller) {
        this.unassignMasterScroller()
      }
    }

    enhancedScroller
      .on('scrollStart', onScrollStart)
      .on('scroll', onScroll)
      .on('scrollEnd', onScrollEnd)

    this.destroys.push(() => {
      enhancedScroller
        .off('scrollStart', onScrollStart)
        .off('scroll', onScroll)
        .off('scrollEnd', onScrollEnd)
    })
  }


  assignMasterScroller(scroller) {
    this.unassignMasterScroller()
    this.masterScroller = scroller

    for (let otherScroller of this.props.scrollers) {
      if (otherScroller !== scroller) {
        otherScroller.enhancedScroller.disableTouchScroll()
      }
    }
  }


  unassignMasterScroller() {
    if (this.masterScroller) {
      for (let otherScroller of this.props.scrollers) {
        otherScroller.enhancedScroller.enableTouchScroll()
      }
      this.masterScroller = null
    }
  }


  updateSize() {
    let { scrollers, axis } = this.props
    let allWidths = scrollers.map((scroller) => scroller.getScrollbarWidths())
    let maxLeft = 0
    let maxRight = 0
    let maxTop = 0
    let maxBottom = 0
    let widths
    let i

    for (widths of allWidths) {
      maxLeft = Math.max(maxLeft, widths.left)
      maxRight = Math.max(maxRight, widths.right)
      maxTop = Math.max(maxTop, widths.top)
      maxBottom = Math.max(maxBottom, widths.bottom)
    }

    for (i = 0; i < scrollers.length; i++) {
      let scroller = scrollers[i]
      widths = allWidths[i]
      scroller.canvas.setGutters(
        axis === 'horizontal' ?
          {
            left: maxLeft - widths.left,
            right: maxRight - widths.right
          } :
          {
            top: maxTop - widths.top,
            bottom: maxBottom - widths.bottom
          }
      )
    }
  }

}

ScrollJoiner.addPropsEquality({
  scrollers: isArraysEqual
})
