import * as $ from 'jquery'
import { FillRenderer } from 'fullcalendar'


export default class TimelineFillRenderer extends FillRenderer {

  /*
  component must be { bgSegContainerEl, rangeToCoords }
  */

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
      const containerEl = $('<div class="fc-' + className + '-container" />')
        .appendTo(this.component.bgSegContainerEl)

      for (let seg of segs) {
        const coords = this.component.rangeToCoords(seg) // TODO: make DRY

        seg.el.css({
          left: (seg.left = coords.left),
          right: -(seg.right = coords.right)
        })

        seg.el.appendTo(containerEl)
      }

      return containerEl // return value
    }
  }

}
