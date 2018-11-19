import { createElement, ComponentContext, EventInteractionUiState, DateSpan, EventUiHash, EventStore, DateProfile } from 'fullcalendar'
import { Resource } from '../structs/resource'
import Row from './Row'
import SpreadsheetRow from './SpreadsheetRow'
import TimelineLane from './TimelineLane'

export interface ResourceRowProps {
  dateProfile: DateProfile
  businessHours: EventStore | null
  eventStore: EventStore | null
  eventUis: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionUiState | null
  eventResize: EventInteractionUiState | null
  resource: Resource
  resourceFields: any
  rowSpans: number[]
  depth: number
  hasChildren: boolean
  colSpecs: any
}

export default class ResourceRow extends Row<ResourceRowProps> {

  innerContainerEl: HTMLElement

  spreadsheetRow: SpreadsheetRow
  lane: TimelineLane

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

    this.timeAxisTr.setAttribute(
      'data-resource-id',
      props.resource.publicId || ''
    )

    this.spreadsheetRow.receiveProps({
      resource: props.resource,
      resourceFields: props.resourceFields,
      rowSpans: props.rowSpans,
      depth: props.depth,
      hasChildren: props.hasChildren,
      colSpecs: props.colSpecs
    })

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
  }

  updateSize(viewHeight: number, isAuto: boolean, isResize: boolean) {
    super.updateSize(viewHeight, isAuto, isResize)

    this.lane.updateSize(viewHeight, isAuto, isResize)
  }

  getHeightEls() {
    return [ this.spreadsheetRow.heightEl, this.innerContainerEl ]
  }

}
