import ClippedScroller from './ClippedScroller'

export default class ScrollJoiner {

  axis: any
  scrollers: ClippedScroller[]
  masterScroller: ClippedScroller


  constructor(axis, scrollers: ClippedScroller[]) {
    this.axis = axis
    this.scrollers = scrollers

    for (let scroller of this.scrollers) {
      this.initScroller(scroller)
    }
  }


  initScroller(scroller: ClippedScroller) {
    let enhancedScroll = scroller.enhancedScroll

    // when the user scrolls via mousewheel, we know for sure the target
    // scroller should be the master. capture the various x-browser events that fire.
    const onScroll = () => {
      this.assignMasterScroller(scroller)
    }
    'wheel mousewheel DomMouseScroll MozMousePixelScroll'.split(' ').forEach((evName) => {
      enhancedScroll.el.addEventListener(evName, onScroll)
    })

    enhancedScroll
      .on('scrollStart', () => {
        if (!this.masterScroller) {
          this.assignMasterScroller(scroller)
        }
      })
      .on('scroll', () => {
        if (scroller === this.masterScroller) {
          for (let otherScroller of this.scrollers) {
            if (otherScroller !== scroller) {
              switch (this.axis) {
                case 'horizontal':
                  otherScroller.enhancedScroll.el.scrollLeft = enhancedScroll.el.scrollLeft
                  break
                case 'vertical':
                  otherScroller.enhancedScroll.setScrollTop(enhancedScroll.getScrollTop())
                  break
              }
            }
          }
        }
      })
      .on('scrollEnd', () => {
        if (scroller === this.masterScroller) {
          this.unassignMasterScroller()
        }
      })
  }


  assignMasterScroller(scroller) {
    this.unassignMasterScroller()
    this.masterScroller = scroller

    for (let otherScroller of this.scrollers) {
      if (otherScroller !== scroller) {
        otherScroller.enhancedScroll.disableTouchScroll()
      }
    }
  }


  unassignMasterScroller() {
    if (this.masterScroller) {
      for (let otherScroller of this.scrollers) {
        otherScroller.enhancedScroll.enableTouchScroll()
      }
      this.masterScroller = null
    }
  }


  update() {
    const allWidths = this.scrollers.map((scroller) => scroller.getScrollbarWidths())
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

    for (i = 0; i < this.scrollers.length; i++) {
      let scroller = this.scrollers[i]
      widths = allWidths[i]
      scroller.enhancedScroll.canvas.setGutters(
        this.axis === 'horizontal' ?
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
