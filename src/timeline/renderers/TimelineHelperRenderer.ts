import * as $ from 'jquery'
import { HelperRenderer } from 'fullcalendar'


export default class TimelineHelperRenderer extends HelperRenderer {

  /*
  component must be { innerEl, rangeToCoords, ?resource }
  */

  renderSegs(segs, sourceSeg) {
    const helperNodes = [] // .fc-event-container

    for (let seg of segs) {

      // TODO: centralize logic (also in renderFgSegsInContainers)
      const coords = this.component.rangeToCoords(seg)
      seg.el.css({
        left: (seg.left = coords.left),
        right: -(seg.right = coords.right)
      })

      // TODO: detangle the concept of resources
      // TODO: how to identify these two segs as the same!?
      if (sourceSeg && (sourceSeg.resourceId === (this.component.resource != null ? this.component.resource.id : undefined))) {
        seg.el.css('top', sourceSeg.el.css('top'))
      } else {
        seg.el.css('top', 0)
      }
    }

    const helperContainerEl = $('<div class="fc-event-container fc-helper-container"/>')
      .appendTo(this.component.innerEl)

    helperNodes.push(helperContainerEl[0])

    for (let seg of segs) {
      helperContainerEl.append(seg.el)
    }

    return $(helperNodes) // return value. TODO: need to accumulate across calls?
  }

}
