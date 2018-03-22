import {
  Scroller, debounce, preventDefault,
  EmitterMixin, EmitterInterface,
  ListenerMixin, ListenerInterface, htmlToElement, removeElement
} from 'fullcalendar'
import ScrollerCanvas from '../util/ScrollerCanvas'


/*
A Scroller with additional functionality:
- optional ScrollerCanvas for content
- fired events for scroll start/end
- cross-browser normalization of horizontal scroll for RTL
*/

export default class EnhancedScroller extends Scroller {

  on: EmitterInterface['on']
  one: EmitterInterface['one']
  off: EmitterInterface['off']
  trigger: EmitterInterface['trigger']
  triggerWith: EmitterInterface['triggerWith']
  hasHandlers: EmitterInterface['hasHandlers']

  listenTo: ListenerInterface['listenTo']
  stopListeningTo: ListenerInterface['stopListeningTo']

  canvas: ScrollerCanvas // an optional ScrollerCanvas
  isScrolling: boolean
  isTouching: boolean // user currently has finger down?
  isTouchedEver: boolean // user ever initiated with touch? (hack)
  isMoving: boolean // whether a scroll event has happened recently
  isTouchScrollEnabled: boolean
  preventTouchScrollHandler: any
  requestMovingEnd: any


  constructor(options?) {
    super(options)

    this.isScrolling = false
    this.isTouching = false
    this.isTouchedEver = false
    this.isMoving = false
    this.isTouchScrollEnabled = true

    this.requestMovingEnd = debounce(this.reportMovingEnd, 500)
  }


  render() {
    super.render()
    if (this.canvas) {
      this.canvas.render()
      this.scrollEl.appendChild(this.canvas.el)
    }
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
      this.scrollEl.addEventListener('touchmove', (this.preventTouchScrollHandler = preventDefault))
    }
  }


  unbindPreventTouchScroll() {
    if (this.preventTouchScrollHandler) {
      this.scrollEl.removeEventListener('touchmove', this.preventTouchScrollHandler)
      this.preventTouchScrollHandler = null
    }
  }


  // Handlers
  // ----------------------------------------------------------------------------------------------


  bindHandlers() {
    return this.listenTo(this.scrollEl, {
      scroll: this.reportScroll,
      touchstart: this.reportTouchStart,
      touchend: this.reportTouchEnd
    })
  }


  unbindHandlers() {
    return this.stopListeningTo(this.scrollEl)
  }


  // Scroll Events
  // ----------------------------------------------------------------------------------------------


  reportScroll() {
    if (!this.isScrolling) {
      this.reportScrollStart()
    }
    this.trigger('scroll')
    this.isMoving = true
    this.requestMovingEnd()
  }


  reportScrollStart() {
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
  reportTouchStart() {
    this.isTouching = true
    this.isTouchedEver = true
  }


  reportTouchEnd() {
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
    const direction = window.getComputedStyle(this.scrollEl).direction
    const node = this.scrollEl
    let val = node.scrollLeft

    if (direction === 'rtl') {
      switch (getRtlScrollSystem()) {
        case 'positive':
          val = (val + node.clientWidth) - node.scrollWidth
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
    const direction = window.getComputedStyle(this.scrollEl).direction
    const node = this.scrollEl

    if (direction === 'rtl') {
      switch (getRtlScrollSystem()) {
        case 'positive':
          val = (val - node.clientWidth) + node.scrollWidth
          break
        case 'reverse':
          val = -val
          break
      }
    }

    node.scrollLeft = val
  }

  /*
  Always returns the number of pixels scrolled from the leftmost position (even if RTL).
  Always positive.
  */
  getScrollFromLeft() {
    const direction = window.getComputedStyle(this.scrollEl).direction
    const node = this.scrollEl
    let val = node.scrollLeft

    if (direction === 'rtl') {
      switch (getRtlScrollSystem()) {
        case 'negative':
          val = (val - node.clientWidth) + node.scrollWidth
          break
        case 'reverse':
          val = (-val - node.clientWidth) + node.scrollWidth
          break
      }
    }

    return val
  }


  getNativeScrollLeft() {
    return this.scrollEl.scrollLeft
  }


  setNativeScrollLeft(val) {
    this.scrollEl.scrollLeft = val
  }

}

EmitterMixin.mixInto(EnhancedScroller)
ListenerMixin.mixInto(EnhancedScroller)


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
