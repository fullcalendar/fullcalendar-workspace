import { EmitterMixin, DelayedRunner, preventDefault } from '@fullcalendar/core'


const WHEEL_EVENT_NAMES = 'wheel mousewheel DomMouseScroll MozMousePixelScroll'.split(' ')


/*
ALSO, with the ability to disable touch
*/
export default class ScrollListener {

  emitter = new EmitterMixin()
  private isScrolling = false
  private isTouching = false // user currently has finger down?
  private isMoving = false // whether a scroll event has happened recently
  private isTouchScrollEnabled = false
  private preventTouchScrollHandler: any
  private moveEndReporter = new DelayedRunner(this._reportMovingEnd.bind(this))


  constructor(public el: HTMLElement) {
    el.addEventListener('scroll', this.reportScroll)
    el.addEventListener('touchstart', this.reportTouchStart, { passive: true })
    el.addEventListener('touchend', this.reportTouchEnd)

    for (let eventName of WHEEL_EVENT_NAMES) {
      el.addEventListener(eventName, this.reportWheel)
    }
  }


  destroy() {
    let { el } = this
    el.removeEventListener('scroll', this.reportScroll)
    el.removeEventListener('touchstart', this.reportTouchStart, { passive: true } as AddEventListenerOptions)
    el.removeEventListener('touchend', this.reportTouchEnd)

    for (let eventName of WHEEL_EVENT_NAMES) {
      el.removeEventListener(eventName, this.reportWheel)
    }
  }


  // Touch scroll prevention
  // ----------------------------------------------------------------------------------------------


  disableTouchScroll() {
    this.isTouchScrollEnabled = false
    this.bindPreventTouchScroll() // will be unbound in enableTouchScroll or reportTouchEnd
  }


  enableTouchScroll() {
    this.isTouchScrollEnabled = true

    // only immediately unbind if a touch event is NOT in progress.
    // otherwise, it will be handled by reportTouchEnd.
    if (!this.isTouching) {
      this.unbindPreventTouchScroll()
    }
  }


  bindPreventTouchScroll() {
    if (!this.preventTouchScrollHandler) {
      this.el.addEventListener('touchmove', (this.preventTouchScrollHandler = preventDefault))
    }
  }


  unbindPreventTouchScroll() {
    if (this.preventTouchScrollHandler) {
      this.el.removeEventListener('touchmove', this.preventTouchScrollHandler)
      this.preventTouchScrollHandler = null
    }
  }


  // Scroll Events
  // ----------------------------------------------------------------------------------------------


  reportScroll = () => {
    if (!this.isScrolling) {
      this.reportScrollStart()
    }
    this.emitter.trigger('scroll')
    this.isMoving = true
    this.moveEndReporter.request(500)
  }


  reportScrollStart = () => {
    if (!this.isScrolling) {
      this.isScrolling = true
      this.emitter.trigger('scrollStart', this.isTouching) // created in constructor
    }
  }


  _reportMovingEnd() {
    this.isMoving = false

    // only end the scroll if not currently touching.
    // if touching, the scrolling will end later, on touchend.
    if (!this.isTouching) {
      this.reportScrollEnd()
    }
  }


  reportScrollEnd() {
    if (this.isScrolling) {
      this.emitter.trigger('scrollEnd')
      this.isScrolling = false
    }
  }


  reportWheel = (ev) => {
    this.emitter.trigger('wheel')
  }


  // Touch Events
  // ----------------------------------------------------------------------------------------------


  // will fire *before* the scroll event is fired
  reportTouchStart = () => {
    this.isTouching = true
  }


  reportTouchEnd = () => {
    if (this.isTouching) {
      this.isTouching = false

      // if touch scrolling was re-enabled during a recent touch scroll
      // then unbind the handlers that are preventing it from happening.
      if (this.isTouchScrollEnabled) {
        this.unbindPreventTouchScroll() // won't do anything if not bound
      }

      // if the user ended their touch, and the scroll area wasn't moving,
      // we consider this to be the end of the scroll.
      if (!this.isMoving) {
        this.reportScrollEnd() // won't fire if already ended
      }
    }
  }

}
