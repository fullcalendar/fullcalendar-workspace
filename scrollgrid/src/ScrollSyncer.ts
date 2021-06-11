import { ScrollListener } from './ScrollListener'
import { setScrollFromLeftEdge } from './scroll-left-norm'

export class ScrollSyncer {
  private masterEl: HTMLElement
  private scrollListeners: ScrollListener[]
  private isPaused: boolean = false

  constructor(
    private isVertical: boolean,
    private scrollEls: HTMLElement[],
  ) {
    this.scrollListeners = scrollEls.map((el) => this.bindScroller(el))
  }

  destroy() {
    for (let scrollListener of this.scrollListeners) {
      scrollListener.destroy()
    }
  }

  bindScroller(el: HTMLElement) {
    let { scrollEls, isVertical } = this
    let scrollListener = new ScrollListener(el)

    const onScroll = (isWheel, isTouch) => {
      if (!this.isPaused) {
        if (!this.masterEl || (this.masterEl !== el && (isWheel || isTouch))) {
          this.assignMaster(el)
        }

        if (this.masterEl === el) { // dealing with current
          for (let otherEl of scrollEls) {
            if (otherEl !== el) {
              if (isVertical) {
                otherEl.scrollTop = el.scrollTop
              } else {
                otherEl.scrollLeft = el.scrollLeft
              }
            }
          }
        }
      }
    }

    const onScrollEnd = () => {
      if (this.masterEl === el) {
        this.masterEl = null
      }
    }

    scrollListener.emitter.on('scroll', onScroll)
    scrollListener.emitter.on('scrollEnd', onScrollEnd)

    return scrollListener
  }

  assignMaster(el: HTMLElement) {
    this.masterEl = el

    for (let scrollListener of this.scrollListeners) {
      if (scrollListener.el !== el) {
        scrollListener.endScroll() // to prevent residual scrolls from reclaiming master
      }
    }
  }

  /*
  will normalize the scrollLeft value
  */
  forceScrollLeft(scrollLeft: number) {
    this.isPaused = true

    for (let listener of this.scrollListeners) {
      setScrollFromLeftEdge(listener.el, scrollLeft)
    }

    this.isPaused = false
  }

  forceScrollTop(top: number) {
    this.isPaused = true

    for (let listener of this.scrollListeners) {
      listener.el.scrollTop = top
    }

    this.isPaused = false
  }
}
