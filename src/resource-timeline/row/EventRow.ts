import RowParent from './RowParent'
import TimelineFillRenderer from '../../timeline/renderers/TimelineFillRenderer'
import TimelineEventRenderer from '../../timeline/renderers/TimelineEventRenderer'
import TimelineMirrorRenderer from '../../timeline/renderers/TimelineMirrorRenderer'


export default class EventRow extends RowParent {

  segContainerEl: HTMLElement // for EventRenderer
  segContainerHeight: any
  innerEl: HTMLElement
  bgSegContainerEl: HTMLElement // for EventRenderer. same el as innerEl :(


  renderEventSkeleton(tr: HTMLElement) {
    const { theme } = this.view.calendar

    tr.innerHTML = `\
<td class="` + theme.getClass('widgetContent') + `"> \
<div> \
<div class="fc-event-container"></div> \
</div> \
</td>\
`

    this.segContainerEl = tr.querySelector('.fc-event-container')
    this.innerEl = (this.bgSegContainerEl = tr.querySelector('td > div'))
  }


  rangeToCoords(range) {
    return this.view.rangeToCoords(range)
  }


  componentFootprintToSegs(componentFootprint) {
    return this.view.componentFootprintToSegs(componentFootprint)
  }

}

EventRow.prototype.fillRendererClass = TimelineFillRenderer
EventRow.prototype.eventRendererClass = TimelineEventRenderer
EventRow.prototype.mirrorRendererClass = TimelineMirrorRenderer

EventRow.prototype.hasOwnRow = true
