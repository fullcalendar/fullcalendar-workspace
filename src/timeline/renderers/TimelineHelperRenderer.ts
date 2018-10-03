import { MirrorRenderer, applyStyle, createElement } from 'fullcalendar'


export default class TimelineMirrorRenderer extends MirrorRenderer {

  /*
  component must be { innerEl, rangeToCoords, ?resource }
  */

  renderSegs(segs, sourceSeg) {
    const mirrorNodes = [] // .fc-event-container

    for (let seg of segs) {
      // TODO: centralize logic (also in renderFgSegsInContainers)
      const coords = this.component.rangeToCoords(seg)
      applyStyle(seg.el, {
        left: (seg.left = coords.left),
        right: -(seg.right = coords.right)
      })

      // TODO: position the top coordinate to match sourceSeg,
      // but only if the mirror seg being dragged is in the same container as the sourceSeg,
      // which is hard to determine
    }

    const mirrorContainerEl = createElement('div', { className: 'fc-event-container fc-mirror-container' })
    this.component.innerEl.appendChild(mirrorContainerEl)

    mirrorNodes.push(mirrorContainerEl)

    for (let seg of segs) {
      mirrorContainerEl.appendChild(seg.el)
    }

    return mirrorNodes // return value. TODO: need to accumulate across calls?
  }

}
