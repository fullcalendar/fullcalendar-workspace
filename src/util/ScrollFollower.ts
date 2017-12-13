import * as $ from 'jquery'
import { getContentRect, getOuterRect } from 'fullcalendar'
import ScrollFollowerSprite from './ScrollFollowerSprite'


export default class ScrollFollower {

  scroller: any
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
  `els` is as a jQuery set of elements.
  If elements are already position:relative, is a performance benefit.
  */
  setSpriteEls(els) {
    this.clearSprites()
    els.each((i, node) => {
      this.addSprite(
        new ScrollFollowerSprite($(node))
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
    this.contentOffset = this.scroller.canvas.el.offset()
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
  getContentRect(el) {
    return getContentRect(el, this.contentOffset)
  }


  // relative to inner content pane
  getBoundingRect(el) {
    return getOuterRect(el, this.contentOffset)
  }


  iterSprites(func) {
    for (let id in this.spritesById) {
      const sprite = this.spritesById[id]
      func(sprite, id)
    }
  }

}
