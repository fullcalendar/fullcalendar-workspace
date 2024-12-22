import { Emitter, isArraysEqual, Scroller, ScrollerSyncerInterface } from "@fullcalendar/core/internal"

/*
Fires:
- scrollEnd: (x, y) => void
*/
export class ScrollerSyncer implements ScrollerSyncerInterface {
  private emitter: Emitter<any> = new Emitter()
  private scrollers: Scroller[] = []
  private destroyFuncs: (() => void)[] = []
  private masterScroller: Scroller
  private isPaused: boolean = false

  constructor(
    private isHorizontal = false,
  ) {}

  handleChildren(scrollers: Scroller[]): void {
    if (!isArraysEqual(this.scrollers, scrollers)) {
      this.destroy()

      for (const scroller of scrollers) {
        if (scroller) { // could be null
          this.destroyFuncs.push(this.bindScroller(scroller))
          this.scrollers.push(scroller)
        }
      }
    }
  }

  destroy() {
    for (let destroyFunc of this.destroyFuncs) {
      destroyFunc()
    }
    this.destroyFuncs = []
    this.scrollers = []
  }

  get x() {
    const { scrollers, masterScroller } = this
    return (masterScroller || scrollers[0]).x
  }

  get y(): number {
    const { scrollers, masterScroller } = this
    return (masterScroller || scrollers[0]).y
  }

  scrollTo(scrollArg: { x?: number, y?: number }): void {
    this.isPaused = true
    const { scrollers } = this

    for (let scroller of scrollers) {
      scroller.scrollTo(scrollArg)
    }

    this.isPaused = false
  }

  addScrollEndListener(handler: (x: number, y: number) => void): void {
    this.emitter.on('scrollEnd', handler)
  }

  removeScrollEndListener(handler: (x: number, y: number) => void): void {
    this.emitter.off('scrollEnd', handler)
  }

  bindScroller(scroller: Scroller) {
    let { isHorizontal } = this

    const onScroll = ({ isUser }: ScrollListenerArg) => {
      if (!this.isPaused) {
        if (!this.masterScroller || (this.masterScroller !== scroller && isUser)) {
          this.assignMaster(scroller)
        }

        if (this.masterScroller === scroller) { // dealing with current
          for (let otherScroller of this.scrollers) {
            if (otherScroller !== scroller) {
              if (isHorizontal) {
                // TODO: user raw scrollLeft for better performance. No normalization necessary
                otherScroller.scrollTo({ x: scroller.x })
              } else {
                otherScroller.scrollTo({ y: scroller.y })
              }
            }
          }
        }
      }
    }

    const onScrollEnd = () => {
      if (this.masterScroller === scroller) {
        this.masterScroller = null
        this.emitter.trigger('scrollEnd', this.x, this.y)
      }
    }

    scroller.listener.emitter.on('scroll', onScroll)
    scroller.listener.emitter.on('scrollEnd', onScrollEnd)

    return () => {
      scroller.listener.emitter.off('scroll', onScroll)
      scroller.listener.emitter.off('scrollEnd', onScrollEnd)
    }
  }

  assignMaster(masterScroller: Scroller) {
    this.masterScroller = masterScroller

    for (let scroller of this.scrollers) {
      if (scroller !== masterScroller) {
        scroller.endScroll() // to prevent residual scrolls from reclaiming master
      }
    }
  }
}
