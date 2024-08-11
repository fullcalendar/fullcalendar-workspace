import { getNormalizedScrollX, isArraysEqual, Scroller, ScrollerSyncerInterface, setNormalizedScrollX } from "@fullcalendar/core/internal"
import { ScrollListener } from "./ScrollListener.js"

export class ScrollerSyncer implements ScrollerSyncerInterface {
  private scrollers: Scroller[] = [] // TODO: move away from requiring Scroller
  private scrollListeners: ScrollListener[] = []
  private masterEl: HTMLElement
  private isPaused: boolean = false
  private isRtl: boolean

  constructor(
    private isHorizontal = false,
  ) {
  }

  handleChildren(
    scrollers: Scroller[],
    isRtl: boolean,
  ): void {
    if (!isArraysEqual(this.scrollers, scrollers)) {
      this.destroy()
      this.scrollers = scrollers

      const scrollListeners: ScrollListener[] = []
      for (const scroller of scrollers) {
        if (scroller) { // could be null
          scrollListeners.push(
            this.bindScroller(scroller.el)
          )
        }
      }

      this.scrollListeners = scrollListeners
    }

    this.isRtl = isRtl
  }

  destroy() {
    for (let scrollListener of this.scrollListeners) {
      scrollListener.destroy()
    }
  }

  get x() {
    const { scrollListeners, masterEl, isRtl } = this
    const el = masterEl || (scrollListeners.length ? scrollListeners[0].el : undefined)
    return getNormalizedScrollX(el, isRtl)
  }

  get y(): number {
    const { scrollListeners, masterEl } = this
    const el = masterEl || (scrollListeners.length ? scrollListeners[0].el : undefined)
    return el.scrollTop
  }

  scrollTo({ x, y }: { x?: number, y?: number }): void {
    this.isPaused = true
    const { scrollListeners, isRtl } = this

    if (y != null) {
      for (let scrollListener of scrollListeners) {
        scrollListener.el.scrollTop = y
      }
    }

    if (x != null) {
      for (let scrollListener of scrollListeners) {
        setNormalizedScrollX(scrollListener.el, isRtl, x)
      }
    }

    this.isPaused = false
  }

  bindScroller(el: HTMLElement) {
    let { isHorizontal } = this
    let scrollListener = new ScrollListener(el)

    const onScroll = (isWheel: boolean, isTouch: boolean) => {
      if (!this.isPaused) {
        if (!this.masterEl || (this.masterEl !== el && (isWheel || isTouch))) {
          this.assignMaster(el)
        }

        if (this.masterEl === el) { // dealing with current
          for (let scrollListener of this.scrollListeners) {
            const otherEl = scrollListener.el
            if (otherEl !== el) {
              if (isHorizontal) {
                otherEl.scrollLeft = el.scrollLeft
              } else {
                otherEl.scrollTop = el.scrollTop
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
}
