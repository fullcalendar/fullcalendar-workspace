
export default class ScrollJoiner {

  axis: any
  scrollers: any
  masterScroller: any


  constructor(axis, scrollers) {
    this.axis = axis
    this.scrollers = scrollers

    for (let scroller of this.scrollers) {
      this.initScroller(scroller)
    }
  }


  initScroller(scroller) {

    // when the user scrolls via mousewheel, we know for sure the target
    // scroller should be the master. capture the various x-browser events that fire.
    scroller.scrollEl.on('wheel mousewheel DomMouseScroll MozMousePixelScroll', () => {
      this.assignMasterScroller(scroller)
    })

    scroller.on('scrollStart', () => {
      if (!this.masterScroller) {
        this.assignMasterScroller(scroller)
      }
    }).on('scroll', () => {
      if (scroller === this.masterScroller) {
        for (let otherScroller of this.scrollers) {
          if (otherScroller !== scroller) {
            switch (this.axis) {
              case 'horizontal':
                otherScroller.setNativeScrollLeft(scroller.getNativeScrollLeft())
                break
              case 'vertical':
                otherScroller.setScrollTop(scroller.getScrollTop())
                break
            }
          }
        }
      }
    }).on('scrollEnd', () => {
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
        otherScroller.disableTouchScroll()
      }
    }
  }


  unassignMasterScroller() {
    if (this.masterScroller) {
      for (let otherScroller of this.scrollers) {
        otherScroller.enableTouchScroll()
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
    let scroller
    let widths
    let i

    for (widths of allWidths) {
      maxLeft = Math.max(maxLeft, widths.left)
      maxRight = Math.max(maxRight, widths.right)
      maxTop = Math.max(maxTop, widths.top)
      maxBottom = Math.max(maxBottom, widths.bottom)
    }

    for (i = 0; i < this.scrollers.length; i++) {
      scroller = this.scrollers[i]
      widths = allWidths[i]
      scroller.canvas.setGutters(
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
