import { FillRenderer, applyStyle, makeElement } from 'fullcalendar'
import TimelineView from '../TimelineView'


export default class TimelineFillRenderer extends FillRenderer {

  component: TimelineView


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
      const containerEl = makeElement('div', { className: 'fc-' + className + '-container' })
      this.component.bgSegContainerEl.appendChild(containerEl)

      for (let seg of segs) {
        const coords = this.component.rangeToCoords(seg) // TODO: make DRY

        applyStyle(seg.el, {
          left: (seg.left = coords.left),
          right: -(seg.right = coords.right)
        })

        containerEl.appendChild(seg.el)
      }

      return [ containerEl ] // return value
    }
  }

}
