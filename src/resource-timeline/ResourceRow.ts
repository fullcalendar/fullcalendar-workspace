import { createElement, ComponentContext, EventInteractionState, DateSpan, EventUiHash, EventStore, DateProfile, memoizeRendering, isArraysEqual } from 'fullcalendar'
import Row from './Row'
import SpreadsheetRow from './SpreadsheetRow'
import TimelineLane from '../timeline/TimelineLane'
import { Resource } from '../structs/resource'
import { updateTrResourceId } from './render-utils'
import ResourceApi from '../api/ResourceApi'


export interface ResourceRowProps {
  dateProfile: DateProfile
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
  private _triggerResourceRender = memoizeRendering(this.triggerResourceRender)

  constructor(context: ComponentContext, a, b, c, d, timeAxis) {
    super(context, a, b, c, d)

    this.spreadsheetRow = new SpreadsheetRow(context, this.spreadsheetTr)

    this.timeAxisTr.appendChild(
      createElement('td', null,
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
      businessHours: props.businessHours,
      eventStore: props.eventStore,
      eventUiBases: props.eventUiBases,
      dateSelection: props.dateSelection,
      eventSelection: props.eventSelection,
      eventDrag: props.eventDrag,
      eventResize: props.eventResize
    })

    this._triggerResourceRender(this.spreadsheetRow.tr, this.timeAxisTr)

    this.isSizeDirty = true
  }

  // purposely does not accept resource obj. if did, would trigger every time data changed
  triggerResourceRender(labelEl: HTMLElement, bodyEl: HTMLElement) {
    let { view } = this

    view.publiclyTrigger('resourceRender', [
      {
        resource: new ResourceApi(this.calendar, this.props.resource),
        labelEl,
        bodyEl,
        view
      }
    ])
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
