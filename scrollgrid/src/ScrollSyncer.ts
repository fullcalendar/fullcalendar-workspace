import { SubRenderer, isArraysEqual } from '@fullcalendar/core'
import ScrollListener from './ScrollListener'
import { setScrollFromStartingEdge } from './scroll-left-norm'


export interface ScrollSyncerProps {
  isVertical: boolean
  scrollEls: HTMLElement[]
}


export default class ScrollSyncer extends SubRenderer<ScrollSyncerProps> {

  private masterEl: HTMLElement
  private scrollListeners: ScrollListener[]
  private isPaused: boolean = false


  render(props: ScrollSyncerProps) {
    this.scrollListeners = props.scrollEls.map((el) => this.bindScroller(el))
  }


  unrender() {
    for (let scrollListener of this.scrollListeners) {
      scrollListener.destroy()
    }
  }


  bindScroller(el: HTMLElement) {
    let scrollListener = new ScrollListener(el)

    const onScrollStart = () => {
      if (!this.isPaused && !this.masterEl) {
        this.assignMaster(el)
      }
    }

    const onScroll = () => {
      if (!this.isPaused && el === this.masterEl) {
        for (let otherEl of this.props.scrollEls) {
          if (otherEl !== el) {
            if (this.props.isVertical) {
              otherEl.scrollTop = el.scrollTop
            } else {
              otherEl.scrollLeft = el.scrollLeft
            }
          }
        }
      }
    }

    const onScrollEnd = () => {
      if (!this.isPaused && el === this.masterEl) {
        this.unassignMaster()
      }
    }

    // when the user scrolls via mousewheel, we know for sure the target
    // scroller should be the master. capture the various x-browser events that fire.
    const onWheel = () => {
      if (!this.isPaused) {
        this.assignMaster(el)
      }
    }

    scrollListener.emitter
      .on('scrollStart', onScrollStart)
      .on('scroll', onScroll)
      .on('scrollEnd', onScrollEnd)
      .on('wheel', onWheel)

    return scrollListener
  }


  assignMaster(el: HTMLElement) {
    this.unassignMaster()
    this.masterEl = el

    for (let scrollListener of this.scrollListeners) {
      if (scrollListener.el !== el) {
        scrollListener.disableTouchScroll()
      }
    }
  }


  unassignMaster() {
    if (this.masterEl) {

      for (let scrollListener of this.scrollListeners) {
        scrollListener.enableTouchScroll()
      }

      this.masterEl = null
    }
  }


  /*
  will normalize the scrollLeft value
  */
  forceScrollLeft(scrollLeft: number) {
    this.isPaused = true

    for (let listener of this.scrollListeners) {
      setScrollFromStartingEdge(listener.el, scrollLeft)
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

ScrollSyncer.addPropsEquality({
  scrollEls: isArraysEqual
})
