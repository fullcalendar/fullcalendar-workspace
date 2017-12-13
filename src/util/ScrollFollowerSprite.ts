import { intersectRects } from 'fullcalendar'


export default class ScrollFollowerSprite {

  static uid = 0

  id: any
  follower: any // must be set by caller
  el: any
  absoluteEl: any
  naturalRect: any
  parentRect: any
  containerRect: any
  isEnabled: boolean // determines whether css position will be assigned. will still calculate position
  isHFollowing: boolean
  isVFollowing: boolean
  doAbsolute: boolean
  isAbsolute: boolean
  isCentered: boolean
  rect: any // if null, then completely offscreen
  isBlock: boolean
  naturalWidth: any


  /*
  If given el is already position:relative, is a performance gain
  */
  constructor(el) {
    this.isEnabled = true
    this.isHFollowing = false
    this.isVFollowing = false
    this.doAbsolute = false
    this.isAbsolute = false
    this.isCentered = false
    this.isBlock = false

    this.el = el
    this.id = String(ScrollFollowerSprite.uid++)
    this.isBlock = this.el.css('display') === 'block'

    if (this.el.css('position') !== 'relative') {
      this.el.css('position', 'relative')
    }
  }


  disable() {
    if (this.isEnabled) {
      this.isEnabled = false
      this.resetPosition()
      this.unabsolutize()
    }
  }


  enable() {
    if (!this.isEnabled) {
      this.isEnabled = true
      this.assignPosition()
    }
  }


  clear() {
    this.disable()
    this.follower = null
    this.absoluteEl = null
  }


  cacheDimensions() {
    let isHFollowing = false
    let isVFollowing = false
    let isCentered = false

    this.naturalWidth = this.el.width()

    this.resetPosition()
    const { follower } = this
    const naturalRect = (this.naturalRect = follower.getBoundingRect(this.el))
    const parentEl = this.el.parent()
    this.parentRect = follower.getBoundingRect(parentEl)
    const containerRect = (this.containerRect = joinRects(follower.getContentRect(parentEl), naturalRect))
    const { minTravel } = follower

    if (follower.containOnNaturalLeft) {
      containerRect.left = naturalRect.left
    }

    if (follower.containOnNaturalRight) {
      containerRect.right = naturalRect.right
    }

    if (follower.isHFollowing) {
      if ((getRectWidth(containerRect) - getRectWidth(naturalRect)) >= minTravel) {
        isCentered = this.el.css('text-align') === 'center'
        isHFollowing = true
      }
    }

    if (follower.isVFollowing) {
      if ((getRectHeight(containerRect) - getRectHeight(naturalRect)) >= minTravel) {
        isVFollowing = true
      }
    }

    this.isHFollowing = isHFollowing
    this.isVFollowing = isVFollowing
    this.isCentered = isCentered
  }


  updatePosition() {
    this.computePosition()
    this.assignPosition()
  }


  resetPosition() {
    this.el.css({
      top: '',
      left: ''
    })
  }


  computePosition() {
    const { viewportRect } = this.follower
    const { parentRect } = this
    const { containerRect } = this
    const visibleParentRect = intersectRects(viewportRect, parentRect)
    let rect = null
    let doAbsolute = false

    if (visibleParentRect) { // is parent element onscreen?
      rect = copyRect(this.naturalRect)
      const subjectRect = intersectRects(rect, parentRect)

      // will we need to reposition?
      if ((this.isCentered && !testRectContains(viewportRect, parentRect)) || // centering and container not completely in view?
         (subjectRect && !testRectContains(viewportRect, subjectRect))) { // subject not completely in view?

        doAbsolute = true

        if (this.isHFollowing) {
          if (this.isCentered) {
            const rectWidth = getRectWidth(rect)
            rect.left = ((visibleParentRect.left + visibleParentRect.right) / 2) - (rectWidth / 2)
            rect.right = rect.left + rectWidth
          } else {
            if (!hContainRect(rect, viewportRect)) { // move into view. already there?
              doAbsolute = false
            }
          }

          if (hContainRect(rect, containerRect)) { // move within container. needed to move?
            doAbsolute = false
          }
        }

        if (this.isVFollowing) {
          if (!vContainRect(rect, viewportRect)) { // move into view. already there?
            doAbsolute = false
          }

          if (vContainRect(rect, containerRect)) { // move within container. needed to move?
            doAbsolute = false
          }
        }

        if (!testRectContains(viewportRect, rect)) { // partially offscreen?
          doAbsolute = false
        }
      }
    }

    this.rect = rect
    this.doAbsolute = doAbsolute
  }


  assignPosition() {
    if (this.isEnabled) {
      if (!this.rect) { // completely offscreen?
        this.unabsolutize()
      } else if (this.doAbsolute && !this.follower.isForcedRelative) {
        this.absolutize()
        this.absoluteEl.css({
          top: (this.rect.top - this.follower.viewportRect.top) + this.follower.scrollbarWidths.top,
          left: (this.rect.left - this.follower.viewportRect.left) + this.follower.scrollbarWidths.left,
          width: this.isBlock ? this.naturalWidth : ''
        })
      } else {
        const top = this.rect.top - this.naturalRect.top
        const left = this.rect.left - this.naturalRect.left
        this.unabsolutize()
        this.el.toggleClass('fc-following', Boolean(top || left))
          .css({
            top,
            left
          })
      }
    }
  }


  absolutize() {
    if (!this.isAbsolute) {
      if (!this.absoluteEl) {
        this.absoluteEl = this.buildAbsoluteEl()
      }
      this.absoluteEl.appendTo(this.follower.scroller.el)
      this.el.css('visibility', 'hidden')
      this.isAbsolute = true
    }
  }


  unabsolutize() {
    if (this.isAbsolute) {
      this.absoluteEl.detach()
      this.el.css('visibility', '')
      this.isAbsolute = false
    }
  }


  buildAbsoluteEl() { // TODO: cache this?
    const el = this.el.clone().addClass('fc-following')

    el.css({
      'position': 'absolute',
      'z-index': 1000, // bad, but luckily scoped by .fc-content's z-index
      'font-weight': this.el.css('font-weight'),
      'font-size': this.el.css('font-size'),
      'font-family': this.el.css('font-family'),
      'text-decoration': this.el.css('text-decoration'),
      'color': this.el.css('color'),
      'padding-top': this.el.css('padding-top'),
      'padding-bottom': this.el.css('padding-bottom'),
      'padding-left': this.el.css('padding-left'),
      'padding-right': this.el.css('padding-right')
    })

    if (!this.follower.allowPointerEvents) {
      el.css('pointer-events', 'none')
    }

    return el
  }

}


// Geometry Utils
// ----------------------------------------------------------------------------------------------------------------------
// TODO: move somewhere more common


function copyRect(rect) {
  return {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom
  }
}


function getRectWidth(rect) {
  return rect.right - rect.left
}


function getRectHeight(rect) {
  return rect.bottom - rect.top
}


function testRectContains(rect, innerRect) {
  return testRectHContains(rect, innerRect) && testRectVContains(rect, innerRect)
}


function testRectHContains(rect, innerRect) {
  return (innerRect.left >= rect.left) && (innerRect.right <= rect.right)
}


function testRectVContains(rect, innerRect) {
  return (innerRect.top >= rect.top) && (innerRect.bottom <= rect.bottom)
}


function hContainRect(rect, outerRect) { // returns true if it had to modify rect
  if (rect.left < outerRect.left) {
    rect.right = outerRect.left + getRectWidth(rect)
    rect.left = outerRect.left
    return true
  } else if (rect.right > outerRect.right) {
    rect.left = outerRect.right - getRectWidth(rect)
    rect.right = outerRect.right
    return true
  } else {
    return false
  }
}


function vContainRect(rect, outerRect) { // returns true if it had to modify rect
  if (rect.top < outerRect.top) {
    rect.bottom = outerRect.top + getRectHeight(rect)
    rect.top = outerRect.top
    return true
  } else if (rect.bottom > outerRect.bottom) {
    rect.top = outerRect.bottom - getRectHeight(rect)
    rect.bottom = outerRect.bottom
    return true
  } else {
    return false
  }
}


function joinRects(rect1, rect2) {
  return {
    left: Math.min(rect1.left, rect2.left),
    right: Math.max(rect1.right, rect2.right),
    top: Math.min(rect1.top, rect2.top),
    bottom: Math.max(rect1.bottom, rect2.bottom)
  }
}
