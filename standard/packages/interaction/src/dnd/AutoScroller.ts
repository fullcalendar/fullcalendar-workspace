import { ScrollGeomCache } from '../ScrollGeomCache.js'
import { ElementScrollGeomCache } from '../ElementScrollGeomCache.js'
import { WindowScrollGeomCache } from '../WindowScrollGeomCache.js'

interface Edge {
  scrollCache: ScrollGeomCache
  name: 'top' | 'left' | 'right' | 'bottom'
  distance: number // how many pixels the current pointer is from the edge
}

// If available we are using native "performance" API instead of "Date"
// Read more about it on MDN:
// https://developer.mozilla.org/en-US/docs/Web/API/Performance
const getTime = typeof performance === 'function' ? (performance as any).now : Date.now

/*
For a pointer interaction, automatically scrolls certain scroll containers when the pointer
approaches the edge.

The caller must call start + handleMove + stop.
*/
export class AutoScroller {
  // options that can be set by caller
  isEnabled: boolean = true
  scrollQuery: (Window | string)[] = [window, '.fci-scroller']
  edgeThreshold: number = 50 // pixels
  maxVelocity: number = 300 // pixels per second

  // internal state
  pointerScreenX: number | null = null
  pointerScreenY: number | null = null
  isAnimating: boolean = false
  scrollCaches: ScrollGeomCache[] | null = null
  msSinceRequest?: number

  // protect against the initial pointerdown being too close to an edge and starting the scroll
  everMovedUp: boolean = false
  everMovedDown: boolean = false
  everMovedLeft: boolean = false
  everMovedRight: boolean = false

  start(pageX: number, pageY: number, scrollStartEl: HTMLElement) {
    if (this.isEnabled) {
      this.scrollCaches = this.buildCaches(scrollStartEl)
      this.pointerScreenX = null
      this.pointerScreenY = null
      this.everMovedUp = false
      this.everMovedDown = false
      this.everMovedLeft = false
      this.everMovedRight = false
      this.handleMove(pageX, pageY)
    }
  }

  handleMove(pageX: number, pageY: number) {
    if (this.isEnabled) {
      let pointerScreenX = pageX - window.scrollX
      let pointerScreenY = pageY - window.scrollY

      let yDelta = this.pointerScreenY === null ? 0 : pointerScreenY - this.pointerScreenY
      let xDelta = this.pointerScreenX === null ? 0 : pointerScreenX - this.pointerScreenX

      if (yDelta < 0) {
        this.everMovedUp = true
      } else if (yDelta > 0) {
        this.everMovedDown = true
      }

      if (xDelta < 0) {
        this.everMovedLeft = true
      } else if (xDelta > 0) {
        this.everMovedRight = true
      }

      this.pointerScreenX = pointerScreenX
      this.pointerScreenY = pointerScreenY

      if (!this.isAnimating) {
        this.isAnimating = true
        this.requestAnimation(getTime())
      }
    }
  }

  stop() {
    if (this.isEnabled) {
      this.isAnimating = false // will stop animation

      for (let scrollCache of this.scrollCaches!) {
        scrollCache.destroy()
      }

      this.scrollCaches = null
    }
  }

  requestAnimation(now: number) {
    this.msSinceRequest = now
    requestAnimationFrame(this.animate)
  }

  private animate = () => {
    if (this.isAnimating) { // wasn't cancelled between animation calls
      let edge = this.computeBestEdge(
        this.pointerScreenX! + window.scrollX,
        this.pointerScreenY! + window.scrollY,
      )

      if (edge) {
        let now = getTime()
        this.handleSide(edge, (now - this.msSinceRequest!) / 1000)
        this.requestAnimation(now)
      } else {
        this.isAnimating = false // will stop animation
      }
    }
  }

  private handleSide(edge: Edge, seconds: number) {
    let { scrollCache } = edge
    let { edgeThreshold } = this
    let invDistance = edgeThreshold - edge.distance
    let velocity = // the closer to the edge, the faster we scroll
      ((invDistance * invDistance) / (edgeThreshold * edgeThreshold)) * // quadratic
      this.maxVelocity * seconds
    let sign = 1

    switch (edge.name) {
      case 'left':
        sign = -1
        // falls through
      case 'right':
        scrollCache.setScrollLeft(scrollCache.getScrollLeft() + velocity * sign)
        break

      case 'top':
        sign = -1
        // falls through
      case 'bottom':
        scrollCache.setScrollTop(scrollCache.getScrollTop() + velocity * sign)
        break
    }
  }

  // left/top are relative to document topleft
  private computeBestEdge(left: number, top: number): Edge | null {
    let { edgeThreshold } = this
    let bestSide: Edge | null = null
    let scrollCaches = this.scrollCaches || []

    for (let scrollCache of scrollCaches) {
      let rect = scrollCache.clientRect
      let leftDist = left - rect.left
      let rightDist = rect.right - left
      let topDist = top - rect.top
      let bottomDist = rect.bottom - top

      // completely within the rect?
      if (leftDist >= 0 && rightDist >= 0 && topDist >= 0 && bottomDist >= 0) {
        if (
          topDist <= edgeThreshold && this.everMovedUp && scrollCache.canScrollUp() &&
          (!bestSide || bestSide.distance > topDist)
        ) {
          bestSide = { scrollCache, name: 'top', distance: topDist }
        }

        if (
          bottomDist <= edgeThreshold && this.everMovedDown && scrollCache.canScrollDown() &&
          (!bestSide || bestSide.distance > bottomDist)
        ) {
          bestSide = { scrollCache, name: 'bottom', distance: bottomDist }
        }

        /*
        TODO: fix broken RTL scrolling. canScrollLeft always returning false
        https://github.com/fullcalendar/fullcalendar/issues/4837
        */
        if (
          leftDist <= edgeThreshold && this.everMovedLeft && scrollCache.canScrollLeft() &&
          (!bestSide || bestSide.distance > leftDist)
        ) {
          bestSide = { scrollCache, name: 'left', distance: leftDist }
        }

        if (
          rightDist <= edgeThreshold && this.everMovedRight && scrollCache.canScrollRight() &&
          (!bestSide || bestSide.distance > rightDist)
        ) {
          bestSide = { scrollCache, name: 'right', distance: rightDist }
        }
      }
    }

    return bestSide
  }

  private buildCaches(scrollStartEl: HTMLElement) {
    return this.queryScrollEls(scrollStartEl).map((el) => {
      if (el === window) {
        return new WindowScrollGeomCache(false) // false = don't listen to user-generated scrolls
      }
      return new ElementScrollGeomCache(el, false) // false = don't listen to user-generated scrolls
    })
  }

  private queryScrollEls(scrollStartEl: HTMLElement) {
    let els = []

    for (let query of this.scrollQuery) {
      if (typeof query === 'object') {
        els.push(query)
      } else {
        /*
        TODO: in the future, always have auto-scroll happen on element where current Hit came from
        Ticket: https://github.com/fullcalendar/fullcalendar/issues/4593
        */
        els.push(...Array.prototype.slice.call(
          (scrollStartEl.getRootNode() as ParentNode).querySelectorAll(query),
        ))
      }
    }

    return els
  }
}
