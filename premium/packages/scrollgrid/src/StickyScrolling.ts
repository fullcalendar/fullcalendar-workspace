import { CssDimValue } from '@fullcalendar/core'
import {
  applyStyle,
  translateRect, Rect,
  findElements,
  computeInnerRect,
} from '@fullcalendar/core/internal'
import { ScrollListener } from './ScrollListener.js'
import { getScrollCanvasOrigin } from './scroll-left-norm.js'

interface ElementGeom {
  parentBound: Rect // relative to the canvas origin
  naturalBound: Rect | null // of the el itself
  elWidth: number
  elHeight: number
  textAlign: string
}

const STICKY_SELECTOR = '.fc-sticky'

/*
Goes beyond mere position:sticky, allows horizontal centering

REQUIREMENT: fc-sticky elements, if the fc-sticky className is taken away, should NOT have relative or absolute positioning.
This is because we attach the coords with JS, and the VDOM might take away the fc-sticky class but doesn't know kill the positioning.

TODO: don't query text-align:center. isn't compatible with flexbox centering. instead, check natural X coord within parent container
*/
export class StickyScrolling {
  listener?: ScrollListener

  constructor(
    private scrollEl: HTMLElement,
    private isRtl: boolean,
  ) {
  }

  updateSize = () => {
    let { scrollEl } = this
    let els = findElements(scrollEl, STICKY_SELECTOR)
    let elGeoms = this.queryElGeoms(els)
    let viewportWidth = scrollEl.clientWidth

    assignStickyPositions(els, elGeoms, viewportWidth)
  }

  queryElGeoms(els: HTMLElement[]): ElementGeom[] {
    let { scrollEl, isRtl } = this
    let canvasOrigin = getScrollCanvasOrigin(scrollEl)
    let elGeoms: ElementGeom[] = []

    for (let el of els) {
      let parentBound = translateRect(
        computeInnerRect(el.parentNode as HTMLElement, true, true), // weird way to call this!!!
        -canvasOrigin.left,
        -canvasOrigin.top,
      )

      let elRect = el.getBoundingClientRect()
      let computedStyles = window.getComputedStyle(el)
      let textAlign = window.getComputedStyle(el.parentNode as HTMLElement).textAlign // ask the parent
      let naturalBound = null

      if (textAlign === 'start') {
        textAlign = isRtl ? 'right' : 'left'
      } else if (textAlign === 'end') {
        textAlign = isRtl ? 'left' : 'right'
      }

      if (computedStyles.position !== 'sticky') {
        naturalBound = translateRect(
          elRect,
          -canvasOrigin.left - (parseFloat(computedStyles.left) || 0), // could be 'auto'
          -canvasOrigin.top - (parseFloat(computedStyles.top) || 0),
        )
      }

      elGeoms.push({
        parentBound,
        naturalBound,
        elWidth: elRect.width,
        elHeight: elRect.height,
        textAlign,
      })
    }

    return elGeoms
  }
}

function assignStickyPositions(els: HTMLElement[], elGeoms: ElementGeom[], viewportWidth: number) {
  els.forEach((el, i) => {
    let { textAlign, elWidth, parentBound } = elGeoms[i]
    let parentWidth = parentBound.right - parentBound.left
    let left: CssDimValue

    if (
      textAlign === 'center' &&
      parentWidth > viewportWidth
    ) {
      left = (viewportWidth - elWidth) / 2
    } else { // if parent container can be completely in view, we don't need stickiness
      left = ''
    }

    applyStyle(el, { // will already have fc-sticky class which makes it sticky
      left,
      right: left, // for when centered
      top: 0,
    })
  })
}
