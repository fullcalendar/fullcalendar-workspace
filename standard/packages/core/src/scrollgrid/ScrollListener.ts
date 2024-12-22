import { Emitter } from "../common/Emitter.js"
import { DelayedRunner } from "../util/DelayedRunner.js"

export interface ScrollListenerArg {
  isUser: boolean
  isWheel: boolean
  isMouse: boolean
  isTouch: boolean
}

/*
Fires:
- scroll
- scrollEnd

NOTE: detection is complicated (w/ touch and wheel) because ScrollerSyncer needs to know about it,
but are we sure we can't just ignore programmatic scrollTo() calls with a flag? and determine the
the scroll-master simply by who was the newest scroller? Does passive:true do things asynchronously?
*/
export class ScrollListener {
  public emitter: Emitter<any> = new Emitter()

  private wheelWaiter: DelayedRunner
  private scrollWaiter: DelayedRunner

  private isScroll = false
  private isScrollRecent = false
  private isWheelRecent = false
  private isMouse = false // user currently has mouse down?
  private isTouch = false // user currently has finger down?

  constructor(public el: HTMLElement) {
    this.wheelWaiter = new DelayedRunner(this.handleWheelWait)
    this.scrollWaiter = new DelayedRunner(this.handleScrollWait)

    el.addEventListener('scroll', this.handleScroll)
    el.addEventListener('wheel', this.handleWheel)
    el.addEventListener('mousedown', this.handleMouseDown)
    el.addEventListener('mouseup', this.handleMouseUp)
    el.addEventListener('touchstart', this.handleTouchStart, { passive: true })
    el.addEventListener('touchend', this.handleTouchEnd)
  }

  destroy() {
    let { el } = this

    el.removeEventListener('scroll', this.handleScroll)
    el.removeEventListener('wheel', this.handleWheel)
    el.removeEventListener('mousedown', this.handleMouseDown)
    el.removeEventListener('mouseup', this.handleMouseUp)
    el.removeEventListener('touchstart', this.handleTouchStart, { passive: true } as AddEventListenerOptions)
    el.removeEventListener('touchend', this.handleTouchEnd)
  }

  // Start / Stop
  // ----------------------------------------------------------------------------------------------

  private startScroll() {
    if (!this.isScroll) {
      this.isScroll = true
      this.emitter.trigger('scrollStart')
    }
  }

  endScroll() {
    if (this.isScroll) {
      this.emitter.trigger('scrollEnd')

      this.scrollWaiter.clear()
      this.wheelWaiter.clear()

      this.isScroll = false
      this.isScrollRecent = true
      this.isWheelRecent = false
    }
  }

  // Handlers
  // ----------------------------------------------------------------------------------------------

  private handleScroll = () => {
    this.startScroll()
    this.emitter.trigger('scroll', {
      isUser: this.isWheelRecent || this.isMouse || this.isTouch,
      isWheel: this.isWheelRecent,
      isMouse: this.isMouse,
      isTouch: this.isTouch,
    })
    this.isScrollRecent = true
    this.scrollWaiter.request(500)
  }

  private handleScrollWait = () => {
    this.isScrollRecent = false

    // only end the scroll if not currently touching.
    // if touching, the scrolling will end later, on touchend.
    if (!this.isTouch) {
      this.endScroll()
    }
  }

  // will fire *before* the scroll event is fired (might not cause a scroll)
  private handleWheel = () => {
    this.isWheelRecent = true
    this.wheelWaiter.request(500)
  }

  private handleWheelWait = () => {
    this.isWheelRecent = false
  }

  private handleMouseDown = () => {
    this.isMouse = true
  }

  private handleMouseUp = () => {
    this.isMouse = false
  }

  // will fire *before* the scroll event is fired (might not cause a scroll)
  private handleTouchStart = () => {
    this.isTouch = true
  }

  private handleTouchEnd = () => {
    this.isTouch = false

    // if the user ended their touch, and the scroll area wasn't moving,
    // we consider this to be the end of the scroll (b/c of inertia?)
    if (!this.isScrollRecent) {
      this.endScroll()
    }
  }
}
