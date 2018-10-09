import { FillRenderer, createElement, applyStyle } from 'fullcalendar'
import TimelineView from './TimelineView'

export default class TimelineLaneFillRenderer extends FillRenderer {

  masterContainerEl: HTMLElement // must be set by caller

  attachSegEls(type, segs) {
    if (segs.length) {

      let className
      if (type === 'businessHours') {
        className = 'bgevent'
      } else {
        className = type.toLowerCase()
      }

      // making a new container each time is OKAY
      // all types of segs (background or business hours or whatever) are rendered in one pass
      const containerEl = createElement('div', { className: 'fc-' + className + '-container' })
      this.masterContainerEl.appendChild(containerEl)

      for (let seg of segs) {
        containerEl.appendChild(seg.el)
      }

      return [ containerEl ] // return value
    }
  }

  computeSize(type) {
    let view = this.component.view as TimelineView // BAD
    let segs = this.renderedSegsByType[type] || []

    for (let seg of segs) {
      let coords = view.rangeToCoords(seg)
      seg.left = coords.left
      seg.right = coords.right
    }
  }

  assignSize(type) {
    let segs = this.renderedSegsByType[type] || []

    for (let seg of segs) {
      applyStyle(seg.el, {
        left: seg.left,
        right: -seg.right
      })
    }
  }

}
