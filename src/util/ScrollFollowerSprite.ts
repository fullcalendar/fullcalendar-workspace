import { intersectRects, applyStyle, removeElement, forceClassName } from 'fullcalendar'
import ScrollFollower from './ScrollFollower'


export default class ScrollFollowerSprite {

  static uid = 0

  id: any
  follower: ScrollFollower // must be set by caller
  el: HTMLElement
  absoluteEl: HTMLElement
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
    const computedStyle = window.getComputedStyle(el)

    this.isEnabled = true
    this.isHFollowing = false
    this.isVFollowing = false
    this.doAbsolute = false
    this.isAbsolute = false
    this.isCentered = false
    this.isBlock = false

    this.el = el
    this.id = String(ScrollFollowerSprite.uid++)
    this.isBlock = computedStyle.display === 'block'

    if (computedStyle.position !== 'relative') {
      el.style.position = 'relative'
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

    this.naturalWidth = this.el.offsetWidth

    this.resetPosition()
    const { follower } = this
    const naturalRect = (this.naturalRect = follower.getBoundingRect(this.el))
    const parentEl = this.el.parentNode as HTMLElement
    this.parentRect = follower.getBoundingRect(parentEl)
    const containerRect = (this.containerRect = joinRects(follower.computeInnerRect(parentEl), naturalRect))
    const { minTravel } = follower

    if (follower.containOnNaturalLeft) {
      containerRect.left = naturalRect.left
    }

    if (follower.containOnNaturalRight) {
      containerRect.right = naturalRect.right
    }

    if (follower.isHFollowing) {
      if ((getRectWidth(containerRect) - getRectWidth(naturalRect)) >= minTravel) {
        isCentered = window.getComputedStyle(this.el).textAlign === 'center'
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
    applyStyle(this.el, {
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
        applyStyle(this.absoluteEl, {
          top: (this.rect.top - this.follower.viewportRect.top),
          left: (this.rect.left - this.follower.viewportRect.left) + this.follower.scrollbarWidths.left,
          width: this.isBlock ? this.naturalWidth : ''
        })
      } else {
        const top = this.rect.top - this.naturalRect.top
        const left = this.rect.left - this.naturalRect.left
        this.unabsolutize()
        forceClassName(this.el, 'fc-following', top || left)
        applyStyle(this.el, {
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
      this.follower.scroller.el.appendChild(this.absoluteEl)
      this.el.style.visibility = 'hidden'
      this.isAbsolute = true
    }
  }


  unabsolutize() {
    if (this.isAbsolute) {
      removeElement(this.absoluteEl)
      this.el.style.visibility = ''
      this.isAbsolute = false
    }
  }


  buildAbsoluteEl() { // TODO: cache this?
    const computedStyle = window.getComputedStyle(this.el)
    const el = this.el.cloneNode(true) as HTMLElement

    el.classList.add('fc-following')

    applyStyle(el, {
      position: 'absolute',
      zIndex: 1000, // bad, but luckily scoped by .fc-content's z-index
      fontWeight: computedStyle.fontWeight,
      fontSize: computedStyle.fontSize,
      fontFamily: computedStyle.fontFamily,
      textDecoration: computedStyle.textDecoration,
      color: computedStyle.color,
      paddingTop: computedStyle.paddingTop,
      paddingBottom: computedStyle.paddingBottom,
      paddingLeft: computedStyle.paddingLeft,
      paddingRight: computedStyle.paddingRight
    })

    if (!this.follower.allowPointerEvents) {
      el.style.pointerEvents = 'none'
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
