import * as $ from 'jquery'
import { getContentRect } from 'fullcalendar'
import EnhancedScroller from '../util/EnhancedScroller'
import ScrollFollowerSprite from './ScrollFollowerSprite'


export default class ScrollFollower {

  scroller: EnhancedScroller
  scrollbarWidths: any
  spritesById: any
  viewportRect: any // relative to content pane
  contentOffset: any
  isHFollowing: boolean
  isVFollowing: boolean

  allowPointerEvents: boolean

  containOnNaturalLeft: boolean
  containOnNaturalRight: boolean
  minTravel: number // set by the caller

  // TODO: improve
  isTouch: boolean
  isForcedRelative: boolean


  constructor(scroller, allowPointerEvents = false) {

    this.isHFollowing = true
    this.isVFollowing = false
    this.allowPointerEvents = false
    this.containOnNaturalLeft = false
    this.containOnNaturalRight = false
    this.minTravel = 0

    this.allowPointerEvents = allowPointerEvents
    this.scroller = scroller
    this.spritesById = {}

    scroller.on('scroll', () => {
      if (scroller.isTouchedEver) {
        // touch devices should only updated after the scroll is over
        this.isTouch = true
        this.isForcedRelative = true // touch devices scroll too quick to make absolute ever look good
      } else {
        this.isTouch = false
        // this.isForcedRelative = false // why?
        this.handleScroll()
      }
    })

    // for touch devices
    scroller.on('scrollEnd', () => {
      this.handleScroll()
    })
  }


  // TODO: have a destroy method.
  // View's whose skeletons get destroyed should unregister their scrollfollowers.

  /*
  If elements are already position:relative, is a performance benefit.
  */
  setSpriteEls(els: HTMLElement[]) {
    this.clearSprites()
    els.forEach((node) => {
      this.addSprite(
        new ScrollFollowerSprite(node)
      )
    })
  }


  clearSprites() {
    this.iterSprites((sprite) => sprite.clear())
    this.spritesById = {}
  }


  addSprite(sprite) {
    sprite.follower = this
    this.spritesById[sprite.id] = sprite
  }


  removeSprite(sprite) {
    sprite.clear()
    delete this.spritesById[sprite.id]
  }


  handleScroll() {
    this.updateViewport()
    this.updatePositions()
  }


  cacheDimensions() {
    this.updateViewport()
    this.scrollbarWidths = this.scroller.getScrollbarWidths()
    this.contentOffset = this.scroller.canvas.el.getBoundingClientRect()
    this.iterSprites((sprite) => sprite.cacheDimensions())
  }


  updateViewport() {
    const { scroller } = this
    const left = scroller.getScrollFromLeft()
    const top = scroller.getScrollTop()

    // TODO: use getViewportRect() for getting this rect
    return this.viewportRect = {
      left,
      right: left + scroller.getClientWidth(),
      top,
      bottom: top + scroller.getClientHeight()
    }
  }


  forceRelative() {
    if (!this.isForcedRelative) {
      this.isForcedRelative = true
      this.iterSprites(function(sprite) {
        if (sprite.doAbsolute) {
          return sprite.assignPosition()
        }
      })
    }
  }


  clearForce() {
    if (this.isForcedRelative && !this.isTouch) { // don't allow touch to ever NOT be relative
      this.isForcedRelative = false
      this.iterSprites(sprite => sprite.assignPosition())
    }
  }


  update() {
    this.cacheDimensions()
    this.updatePositions()
  }


  updatePositions() {
    this.iterSprites(sprite => sprite.updatePosition())

  }


  // relative to inner content pane
  getContentRect(el: HTMLElement) {
    return getContentRect($(el), this.contentOffset)
  }


  // relative to inner content pane
  getBoundingRect(el: HTMLElement) {
    let { contentOffset } = this
    let rect = el.getBoundingClientRect()
    return {
      left: rect.left - contentOffset.left,
      right: rect.right - contentOffset.left,
      top: rect.top - contentOffset.top,
      bottom: rect.bottom - contentOffset.top
    }
  }


  iterSprites(func) {
    for (let id in this.spritesById) {
      const sprite = this.spritesById[id]
      func(sprite, id)
    }
  }

}
