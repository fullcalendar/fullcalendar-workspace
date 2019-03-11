import { Duration, createElement, ComponentContext, EventInteractionState, DateSpan, EventUiHash, EventStore, DateProfile, memoizeRendering, isArraysEqual } from '@fullcalendar/core'
import { TimelineLane, TimeAxis } from '@fullcalendar/timeline'
import Row from './Row'
import SpreadsheetRow from './SpreadsheetRow'
import { Resource } from '@fullcalendar/resource-common'
import { updateTrResourceId } from './render-utils'


export interface ResourceRowProps {
  dateProfile: DateProfile
  nextDayThreshold: Duration
  businessHours: EventStore | null
  eventStore: EventStore | null
  eventUiBases: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  colSpecs: any
  id: string // 'resourceId' (won't collide with group ID's because has colon)
  rowSpans: number[]
  depth: number
  isExpanded: boolean
  hasChildren: boolean
  resource: Resource
}

export default class ResourceRow extends Row<ResourceRowProps> {

  innerContainerEl: HTMLElement

  spreadsheetRow: SpreadsheetRow
  lane: TimelineLane

  private _updateTrResourceId = memoizeRendering(updateTrResourceId)

  constructor(context: ComponentContext, a, b, c, d, timeAxis: TimeAxis) {
    super(context, a, b, c, d)

    this.spreadsheetRow = new SpreadsheetRow(context, this.spreadsheetTr)

    this.timeAxisTr.appendChild(
      createElement('td', { className: this.theme.getClass('widgetContent') },
        this.innerContainerEl = document.createElement('div')
      )
    )

    this.lane = new TimelineLane(
      context,
      this.innerContainerEl,
      this.innerContainerEl,
      timeAxis
    )
  }

  destroy() {
    this.spreadsheetRow.destroy()
    this.lane.destroy()

    super.destroy()
  }

  render(props: ResourceRowProps) {

    // spreadsheetRow handles calling updateTrResourceId for spreadsheetTr

    this.spreadsheetRow.receiveProps({
      colSpecs: props.colSpecs,
      id: props.id,
      rowSpans: props.rowSpans,
      depth: props.depth,
      isExpanded: props.isExpanded,
      hasChildren: props.hasChildren,
      resource: props.resource
    })

    this._updateTrResourceId(this.timeAxisTr, props.resource.id)

    this.lane.receiveProps({
      dateProfile: props.dateProfile,
      nextDayThreshold: props.nextDayThreshold,
      businessHours: props.businessHours,
      eventStore: props.eventStore,
      eventUiBases: props.eventUiBases,
      dateSelection: props.dateSelection,
      eventSelection: props.eventSelection,
      eventDrag: props.eventDrag,
      eventResize: props.eventResize
    })

    this.isSizeDirty = true
  }

  updateSize(isResize: boolean) {
    super.updateSize(isResize)

    this.lane.updateSize(isResize)
  }

  getHeightEls() {
    return [ this.spreadsheetRow.heightEl, this.innerContainerEl ]
  }

}

ResourceRow.addEqualityFuncs({
  rowSpans: isArraysEqual // HACK for isSizeDirty, ResourceTimelineView::renderRows
})
