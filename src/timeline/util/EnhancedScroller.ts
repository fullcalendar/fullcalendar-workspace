import { ScrollComponent, EmitterInterface, EmitterMixin, removeElement, htmlToElement, debounce, preventDefault } from '@fullcalendar/core'
import ScrollerCanvas from './ScrollerCanvas'

export default class EnhancedScroller extends ScrollComponent {

  on: EmitterInterface['on']
  one: EmitterInterface['one']
  off: EmitterInterface['off']
  trigger: EmitterInterface['trigger']
  triggerWith: EmitterInterface['triggerWith']
  hasHandlers: EmitterInterface['hasHandlers']

  canvas: ScrollerCanvas // an optional ScrollerCanvas
  isScrolling: boolean
  isTouching: boolean // user currently has finger down?
  isMoving: boolean // whether a scroll event has happened recently
  isTouchScrollEnabled: boolean
  preventTouchScrollHandler: any
  requestMovingEnd: any


  constructor(overflowX: string, overflowY: string) {
    super(overflowX, overflowY)

    this.isScrolling = false
    this.isTouching = false
    this.isMoving = false
    this.isTouchScrollEnabled = true

    this.requestMovingEnd = debounce(this.reportMovingEnd, 500)

    this.canvas = new ScrollerCanvas()
    this.el.appendChild(this.canvas.el)

    this.applyOverflow()
    this.bindHandlers()
  }


  destroy() {
    super.destroy()
    this.unbindHandlers()
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


  // Handlers
  // ----------------------------------------------------------------------------------------------


  bindHandlers() {
    this.el.addEventListener('scroll', this.reportScroll)
    this.el.addEventListener('touchstart', this.reportTouchStart, { passive: true })
    this.el.addEventListener('touchend', this.reportTouchEnd)
  }


  unbindHandlers() {
    this.el.removeEventListener('scroll', this.reportScroll)
    this.el.removeEventListener('touchstart', this.reportTouchStart, { passive: true } as AddEventListenerOptions)
    this.el.removeEventListener('touchend', this.reportTouchEnd)
  }


  // Scroll Events
  // ----------------------------------------------------------------------------------------------


  reportScroll = () => {
    if (!this.isScrolling) {
      this.reportScrollStart()
    }
    this.trigger('scroll')
    this.isMoving = true
    this.requestMovingEnd()
  }


  reportScrollStart = () => {
    if (!this.isScrolling) {
      this.isScrolling = true
      this.trigger('scrollStart', this.isTouching) // created in constructor
    }
  }


  reportMovingEnd() {
    this.isMoving = false

    // only end the scroll if not currently touching.
    // if touching, the scrolling will end later, on touchend.
    if (!this.isTouching) {
      this.reportScrollEnd()
    }
  }


  reportScrollEnd() {
    if (this.isScrolling) {
      this.trigger('scrollEnd')
      this.isScrolling = false
    }
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


  // Horizontal Scroll Normalization
  // ----------------------------------------------------------------------------------------------
  // http://stackoverflow.com/questions/24276619/better-way-to-get-the-viewport-of-a-scrollable-div-in-rtl-mode/24394376#24394376
  // TODO: move all this to util functions

  /*
  If RTL, and scrolled to the left, returns NEGATIVE value (like Firefox)
  */
  getScrollLeft() {
    let { el } = this
    let direction = window.getComputedStyle(el).direction
    let val = el.scrollLeft

    if (direction === 'rtl') {
      switch (getRtlScrollSystem()) {
        case 'positive':
          val = (val + el.clientWidth) - el.scrollWidth
          break
        case 'reverse':
          val = -val
          break
      }
    }

    return val
  }

  /*
  Accepts a NEGATIVE value for when scrolled in RTL
  */
  setScrollLeft(val) {
    let { el } = this
    const direction = window.getComputedStyle(el).direction

    if (direction === 'rtl') {
      switch (getRtlScrollSystem()) {
        case 'positive':
          val = (val - el.clientWidth) + el.scrollWidth
          break
        case 'reverse':
          val = -val
          break
      }
    }

    el.scrollLeft = val
  }

  /*
  Always returns the number of pixels scrolled from the leftmost position (even if RTL).
  Always positive.
  */
  getScrollFromLeft() {
    let { el } = this
    let direction = window.getComputedStyle(el).direction
    let val = el.scrollLeft

    if (direction === 'rtl') {
      switch (getRtlScrollSystem()) {
        case 'negative':
          val = (val - el.clientWidth) + el.scrollWidth
          break
        case 'reverse':
          val = (-val - el.clientWidth) + el.scrollWidth
          break
      }
    }

    return val
  }

}

EmitterMixin.mixInto(EnhancedScroller)


// Horizontal Scroll System Detection
// ----------------------------------------------------------------------------------------------

let _rtlScrollSystem

function getRtlScrollSystem() {
  return _rtlScrollSystem || (_rtlScrollSystem = detectRtlScrollSystem())
}

function detectRtlScrollSystem() {
  const el = htmlToElement(`\
<div style=" \
position: absolute; \
top: -1000px; \
width: 1px; \
height: 1px; \
overflow: scroll; \
direction: rtl; \
font-size: 100px; \
">A</div>\
`)
  document.body.appendChild(el)

  let system
  if (el.scrollLeft > 0) {
    system = 'positive'
  } else {
    el.scrollLeft = 1
    if (el.scrollLeft > 0) {
      system = 'reverse'
    } else {
      system = 'negative'
    }
  }

  removeElement(el)
  return system
}
