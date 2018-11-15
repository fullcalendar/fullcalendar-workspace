import { createElement, ComponentContext, EventInteractionUiState, DateSpan, EventUiHash, EventStore, DateProfile } from 'fullcalendar'
import { Resource } from '../structs/resource'
import Row from './Row'
import SpreadsheetRow from './SpreadsheetRow'
import TimelineLane from './TimelineLane'

export interface ResourceRowProps {
  dateProfile: DateProfile | null
  businessHours: EventStore
  eventStore: EventStore
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
    this.lane.destroy()

    super.destroy()
  }

  render(props: ResourceRowProps) {

    // TODO: use public ID?
    this.timeAxisTr.setAttribute('data-resource-id', props.resource.resourceId)

    this.spreadsheetRow.receiveProps(props)
    this.lane.receiveProps(props)
  }

  updateSize(viewHeight: number, isAuto: boolean, isResize: boolean) {
    super.updateSize(viewHeight, isAuto, isResize)

    this.lane.updateSize(viewHeight, isAuto, isResize)
  }

  getHeightEls() {
    return [ this.spreadsheetRow.heightEl, this.innerContainerEl ]
  }

}
