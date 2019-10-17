import { FillRenderer, createElement, applyStyle, Seg } from '@fullcalendar/core'
import TimeAxis from './TimeAxis'

export default class TimelineLaneFillRenderer extends FillRenderer {

  timeAxis: TimeAxis
  masterContainerEl: HTMLElement

  constructor(masterContainerEl: HTMLElement, timeAxis: TimeAxis) {
    super()

    this.masterContainerEl = masterContainerEl
    this.timeAxis = timeAxis
  }

  attachSegs(type, segs) {
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

  computeSegSizes(segs: Seg[]) {
    let { timeAxis } = this

    for (let seg of segs) {
      let coords = timeAxis.rangeToCoords(seg)
      seg.left = coords.left
      seg.right = coords.right
    }
  }

  assignSegSizes(segs: Seg[]) {
    for (let seg of segs) {
      applyStyle(seg.el, {
        left: seg.left,
        right: -seg.right
      })
    }
  }

}
