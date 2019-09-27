import { Duration, createElement, ComponentContext, EventInteractionState, DateSpan, EventUiHash, EventStore, DateProfile, memoizeRendering, isArraysEqual, removeElement } from '@fullcalendar/core'
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

  cellEl: HTMLElement
  innerContainerEl: HTMLElement

  timeAxis: TimeAxis
  spreadsheetRow: SpreadsheetRow
  lane: TimelineLane

  private renderSkeleton = memoizeRendering(this._renderSkeleton, this._unrenderSkeleton)
  private updateTrResourceId = memoizeRendering(updateTrResourceId)


  constructor(a, b, c, d, timeAxis: TimeAxis) {
    super(a, b, c, d)

    this.timeAxis = timeAxis
  }


  render(props: ResourceRowProps, context: ComponentContext) {

    this.renderSkeleton(context)

    // spreadsheetRow handles calling updateTrResourceId for spreadsheetTr

    this.spreadsheetRow.receiveProps({
      colSpecs: props.colSpecs,
      id: props.id,
      rowSpans: props.rowSpans,
      depth: props.depth,
      isExpanded: props.isExpanded,
      hasChildren: props.hasChildren,
      resource: props.resource
    }, context)

    this.updateTrResourceId(this.timeAxisTr, props.resource.id)

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
    }, context)

    this.isSizeDirty = true
  }


  destroy() {
    this.renderSkeleton.unrender()

    super.destroy()
  }


  _renderSkeleton(context: ComponentContext) {
    this.timeAxisTr.appendChild(
      this.cellEl = createElement('td', { className: context.theme.getClass('widgetContent') },
        this.innerContainerEl = document.createElement('div')
      )
    )

    this.spreadsheetRow = new SpreadsheetRow(this.spreadsheetTr)

    this.lane = new TimelineLane(
      this.innerContainerEl,
      this.innerContainerEl,
      this.timeAxis
    )
  }


  _unrenderSkeleton() {
    this.spreadsheetRow.destroy()
    this.lane.destroy()

    removeElement(this.cellEl)
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
