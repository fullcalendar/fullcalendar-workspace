import { BusinessHourRenderer } from 'fullcalendar'
import RowParent from './RowParent'
import TimelineFillRenderer from '../../timeline/renderers/TimelineFillRenderer'
import TimelineEventRenderer from '../../timeline/renderers/TimelineEventRenderer'
import TimelineHelperRenderer from '../../timeline/renderers/TimelineHelperRenderer'


export default class EventRow extends RowParent {

  segContainerEl: any // for EventRenderer
  segContainerHeight: any
  innerEl: any
  bgSegContainerEl: any // for EventRenderer. same el as innerEl :(


  renderEventSkeleton(tr) {
    const { theme } = this.view.calendar

    tr.html(`\
<td class="` + theme.getClass('widgetContent') + `"> \
<div> \
<div class="fc-event-container" /> \
</div> \
</td>\
`)

    this.segContainerEl = tr.find('.fc-event-container')
    this.innerEl = (this.bgSegContainerEl = tr.find('td > div'))
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
EventRow.prototype.helperRendererClass = TimelineHelperRenderer
EventRow.prototype.businessHourRendererClass = BusinessHourRenderer

EventRow.prototype.hasOwnRow = true
