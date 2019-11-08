import { Component, ComponentContext, isArraysEqual, renderer, htmlToElement, DateProfile, DateProfileGenerator, Duration, EventStore, EventUiHash, DateSpan, EventInteractionState } from '@fullcalendar/core'
import { TimelineLane, TimeAxis, TimelineDateProfile } from '@fullcalendar/timeline'
import { updateTrResourceId } from './render-utils'

export interface ResourceTimelineLaneRowProps {
  resourceId: string
  dateProfile: DateProfile
  dateProfileGenerator: DateProfileGenerator
  tDateProfile: TimelineDateProfile
  nextDayThreshold: Duration
  businessHours: EventStore | null
  eventStore: EventStore | null
  eventUiBases: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
}

export default class ResourceTimelineLaneRow extends Component<ResourceTimelineLaneRowProps> {

  private renderSkeleton = renderer(this._renderSkeleton)
  private renderLane = renderer(TimelineLane)

  heightEl: HTMLElement
  isSizeDirty = false


  render(props: ResourceTimelineLaneRowProps) {
    let { rootEl, heightEl } = this.renderSkeleton({ resourceId: props.resourceId })

    this.renderLane({
      ...props,
      fgContainerEl: heightEl,
      bgContainerEl: heightEl
    })

    this.heightEl = heightEl
    this.isSizeDirty = true

    return rootEl
  }


  _renderSkeleton(props: { resourceId: string }, context: ComponentContext) {
    let tr = htmlToElement(
      "<tr>" +
        "<td class='" + context.theme.getClass('widgetContent') + "'>" +
          "<div />" +
        "</td>" +
      "</tr>"
    )

    updateTrResourceId(tr, props.resourceId)

    return {
      rootEl: tr,
      heightEl: tr.querySelector('div') as HTMLElement
    }
  }


  updateSize(isResize: boolean, timeAxis: TimeAxis) {
    let lane = this.renderLane.current

    lane.updateSize(isResize, timeAxis)
    this.isSizeDirty = false
  }

}

(ResourceTimelineLaneRow as any).addPropEquality({
  rowSpans: isArraysEqual // HACK for isSizeDirty, ResourceTimelineView::renderRows
})
