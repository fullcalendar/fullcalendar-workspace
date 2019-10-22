import { Scroller, ScrollerProps, EmitterInterface, EmitterMixin, removeElement, htmlToElement, debounce, preventDefault, Component, renderer } from '@fullcalendar/core'
import ScrollerCanvas from './ScrollerCanvas'

export default class EnhancedScroller extends Component<ScrollerProps> {

  on: EmitterInterface['on']
  one: EmitterInterface['one']
  off: EmitterInterface['off']
  trigger: EmitterInterface['trigger']
  triggerWith: EmitterInterface['triggerWith']
  hasHandlers: EmitterInterface['hasHandlers']

  scroller: Scroller
  canvas: ScrollerCanvas // an optional ScrollerCanvas
  isScrolling = false
  isTouching = false // user currently has finger down?
  isMoving = false // whether a scroll event has happened recently
  isTouchScrollEnabled = false
  preventTouchScrollHandler: any
  requestMovingEnd = debounce(this._reportMovingEnd, 500)
  bindHandlers = renderer(this._bindHandlers, this._unbindHandlers)
  renderScroller = renderer(Scroller)
  renderCanvas = renderer(ScrollerCanvas)


  render(props: ScrollerProps) {
    let scroller = this.renderScroller(true, props)
    let canvas = this.renderCanvas(scroller.el, {})

    this.bindHandlers(true, { el: scroller.rootEl })

    this.scroller = scroller
    this.canvas = canvas

    return scroller
  }


  getEl() {
    return this.scroller.rootEl
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
      this.getEl().addEventListener('touchmove', (this.preventTouchScrollHandler = preventDefault))
    }
  }


  unbindPreventTouchScroll() {
    if (this.preventTouchScrollHandler) {
      this.getEl().removeEventListener('touchmove', this.preventTouchScrollHandler)
      this.preventTouchScrollHandler = null
    }
  }


  // Handlers
  // ----------------------------------------------------------------------------------------------


  _bindHandlers({ el }: { el: HTMLElement }) {
    el.addEventListener('scroll', this.reportScroll)
    el.addEventListener('touchstart', this.reportTouchStart, { passive: true })
    el.addEventListener('touchend', this.reportTouchEnd)

    return el
  }


  _unbindHandlers(el: HTMLElement) {
    el.removeEventListener('scroll', this.reportScroll)
    el.removeEventListener('touchstart', this.reportTouchStart, { passive: true } as AddEventListenerOptions)
    el.removeEventListener('touchend', this.reportTouchEnd)
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
    let el = this.getEl()
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
    let el = this.getEl()
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
    let el = this.getEl()
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
