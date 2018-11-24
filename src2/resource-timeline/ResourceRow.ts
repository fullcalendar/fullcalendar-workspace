import { createElement, ComponentContext, EventInteractionUiState, DateSpan, EventUiHash, EventStore, DateProfile, memoizeRendering, isArraysEqual } from 'fullcalendar'
import Row from './Row'
import SpreadsheetRow from './SpreadsheetRow'
import TimelineLane from '../timeline/TimelineLane'
import { Resource } from '../structs/resource'
import { updateTrResourceId } from './render-utils'

export interface ResourceRowProps {
  dateProfile: DateProfile
  businessHours: EventStore | null
  eventStore: EventStore | null
  eventUis: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionUiState | null
  eventResize: EventInteractionUiState | null
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
      eventUis: props.eventUis,
      dateSelection: props.dateSelection,
      eventSelection: props.eventSelection,
      eventDrag: props.eventDrag,
      eventResize: props.eventResize
    })

    this.isSizeDirty = true
  }

  updateSize(isResize: boolean) {
    super.updateSize(isResize)

    this.lane.updateSize(0, false, isResize)
  }

  getHeightEls() {
    return [ this.spreadsheetRow.heightEl, this.innerContainerEl ]
  }

}

ResourceRow.addEqualityFuncs({
  rowSpans: isArraysEqual // important for isSizeDirty
})
