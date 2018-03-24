import { HelperRenderer, applyStyle, createElement } from 'fullcalendar'


export default class TimelineHelperRenderer extends HelperRenderer {

  /*
  component must be { innerEl, rangeToCoords, ?resource }
  */

  renderSegs(segs, sourceSeg) {
    const helperNodes = [] // .fc-event-container

    for (let seg of segs) {
      // TODO: centralize logic (also in renderFgSegsInContainers)
      const coords = this.component.rangeToCoords(seg)
      applyStyle(seg.el, {
        left: (seg.left = coords.left),
        right: -(seg.right = coords.right)
      })

      // TODO: position the top coordinate to match sourceSeg,
      // but only if the helper seg being dragged is in the same container as the sourceSeg,
      // which is hard to determine
    }

    const helperContainerEl = createElement('div', { className: 'fc-event-container fc-helper-container' })
    this.component.innerEl.appendChild(helperContainerEl)

    helperNodes.push(helperContainerEl)

    for (let seg of segs) {
      helperContainerEl.appendChild(seg.el)
    }

    return helperNodes // return value. TODO: need to accumulate across calls?
  }

}
