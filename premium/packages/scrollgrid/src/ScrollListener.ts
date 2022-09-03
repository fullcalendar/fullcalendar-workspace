import { Emitter, DelayedRunner } from '@fullcalendar/common'

const WHEEL_EVENT_NAMES = 'wheel mousewheel DomMouseScroll MozMousePixelScroll'.split(' ')

/*
ALSO, with the ability to disable touch
*/
export class ScrollListener {
  emitter = new Emitter()
  private isScrolling = false
  private isTouching = false // user currently has finger down?
  private isRecentlyWheeled = false
  private isRecentlyScrolled = false
  private wheelWaiter = new DelayedRunner(this._handleWheelWaited.bind(this))
  private scrollWaiter = new DelayedRunner(this._handleScrollWaited.bind(this))

  constructor(public el: HTMLElement) {
    el.addEventListener('scroll', this.handleScroll)
    el.addEventListener('touchstart', this.handleTouchStart, { passive: true })
    el.addEventListener('touchend', this.handleTouchEnd)

    for (let eventName of WHEEL_EVENT_NAMES) {
      el.addEventListener(eventName, this.handleWheel)
    }
  }

  destroy() {
    let { el } = this
    el.removeEventListener('scroll', this.handleScroll)
    el.removeEventListener('touchstart', this.handleTouchStart, { passive: true } as AddEventListenerOptions)
    el.removeEventListener('touchend', this.handleTouchEnd)

    for (let eventName of WHEEL_EVENT_NAMES) {
      el.removeEventListener(eventName, this.handleWheel)
    }
  }

  // Start / Stop
  // ----------------------------------------------------------------------------------------------

  private startScroll() {
    if (!this.isScrolling) {
      this.isScrolling = true
      this.emitter.trigger('scrollStart', this.isRecentlyWheeled, this.isTouching)
    }
  }

  endScroll() {
    if (this.isScrolling) {
      this.emitter.trigger('scrollEnd')
      this.isScrolling = false
      this.isRecentlyScrolled = true
      this.isRecentlyWheeled = false
      this.scrollWaiter.clear()
      this.wheelWaiter.clear()
    }
  }

  // Handlers
  // ----------------------------------------------------------------------------------------------

  handleScroll = () => {
    this.startScroll()
    this.emitter.trigger('scroll', this.isRecentlyWheeled, this.isTouching)
    this.isRecentlyScrolled = true
    this.scrollWaiter.request(500)
  }

  _handleScrollWaited() {
    this.isRecentlyScrolled = false

    // only end the scroll if not currently touching.
    // if touching, the scrolling will end later, on touchend.
    if (!this.isTouching) {
      this.endScroll() // won't fire if already ended
    }
  }

  // will fire *before* the scroll event is fired (might not cause a scroll)
  handleWheel = () => {
    this.isRecentlyWheeled = true
    this.wheelWaiter.request(500)
  }

  _handleWheelWaited() {
    this.isRecentlyWheeled = false
  }

  // will fire *before* the scroll event is fired (might not cause a scroll)
  handleTouchStart = () => {
    this.isTouching = true
  }

  handleTouchEnd = () => {
    this.isTouching = false

    // if the user ended their touch, and the scroll area wasn't moving,
    // we consider this to be the end of the scroll.
    if (!this.isRecentlyScrolled) {
      this.endScroll() // won't fire if already ended
    }
  }
}
