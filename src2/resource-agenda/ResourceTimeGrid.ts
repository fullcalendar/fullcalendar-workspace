import { addMs, DateSpan, Component, TimeGrid, DateProfile, EventStore, EventUiHash, EventInteractionUiState, ComponentContext, reselector, buildDayRanges, sliceTimeGridSegs, DateRange, assignTo, TimeGridSeg, sliceBusinessHours, DateMarker } from "fullcalendar"
import { AbstractResourceDayTable } from './resource-day-table'
import { ResourceAwareSlicer } from './resource-aware-slicing'

export interface ResourceTimeGridProps {
  dateProfile: DateProfile | null
  resourceDayTable: AbstractResourceDayTable
  businessHours: EventStore
  eventStore: EventStore
  eventUis: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionUiState | null
  eventResize: EventInteractionUiState | null
}

export default class ResourceTimeGrid extends Component<ResourceTimeGridProps> {

  timeGrid: TimeGrid

  private buildDayRanges = reselector(buildDayRanges)
  private slicer = new ResourceAwareSlicer(sliceSegs)
  private sliceResourceBusinessHours = reselector(sliceResourceBusinessHours)
  private dayRanges: DateRange[]

  constructor(context: ComponentContext, timeGrid: TimeGrid) {
    super(context)

    this.timeGrid = timeGrid
    this.slicer.component = timeGrid
  }

  render(props: ResourceTimeGridProps) {
    let { slicer } = this
    let { dateProfile, resourceDayTable } = props

    let dayRanges = this.dayRanges =
      this.buildDayRanges(resourceDayTable.dayTable, dateProfile, this.dateEnv)

    this.timeGrid.receiveProps({
      dateProfile: props.dateProfile,
      cells: props.resourceDayTable.cells[0],
      businessHourSegs: this.sliceResourceBusinessHours(resourceDayTable, dateProfile, dayRanges, props.businessHours, this.timeGrid),
      eventSegs: slicer.eventStoreToSegs(props.eventStore, props.eventUis, dateProfile, null, resourceDayTable, dayRanges),
      dateSelectionSegs: slicer.selectionToSegs(props.dateSelection, resourceDayTable, dayRanges),
      eventSelection: props.eventSelection,
      eventDrag: slicer.buildEventDrag(props.eventDrag, dateProfile, null, resourceDayTable, dayRanges),
      eventResize: slicer.buildEventResize(props.eventResize, dateProfile, null, resourceDayTable, dayRanges)
    })
  }

  renderNowIndicator(date: DateMarker) {
    this.timeGrid.renderNowIndicator(
      // seg system might be overkill, but it handles scenario where line needs to be rendered
      //  more than once because of columns with the same date (resources columns for example)
      sliceSegs({
        start: date,
        end: addMs(date, 1) // protect against null range
      }, [], this.props.resourceDayTable, this.dayRanges),
      date
    )
  }

}


function sliceSegs(range: DateRange, resourceIds: string[], resourceDayTable: AbstractResourceDayTable, dayRanges: DateRange[]): TimeGridSeg[] {

  if (!resourceIds.length) {
    resourceIds = resourceDayTable.resourceIndex.publicIds
  }

  let rawSegs = sliceTimeGridSegs(range, dayRanges)
  let segs = []

  for (let rawSeg of rawSegs) {

    for (let resourceId of resourceIds) {
      let resourceI = resourceDayTable.resourceIndex.indicesByPublicId[resourceId]

      if (resourceI != null) {
        segs.push(
          assignTo({}, rawSeg, {
            col: resourceDayTable.computeCol(rawSeg.col, resourceI)
          })
        )
      }
    }
  }

  return segs
}


function sliceResourceBusinessHours(resourceDayTable: AbstractResourceDayTable, dateProfile: DateProfile, dayRanges: DateRange[], fallbackBusinessHours: EventStore, component: TimeGrid) {
  let segs = []

  for (let resource of resourceDayTable.resources) {
    let businessHours = resource.businessHours || fallbackBusinessHours
    let eventRanges = sliceBusinessHours(
      businessHours,
      dateProfile.activeRange,
      null,
      component.calendar
    )

    let resourceI = resourceDayTable.resourceIndex.indicedByInternalId[resource.resourceId]

    for (let eventRange of eventRanges) {
      let rawSegs = sliceTimeGridSegs(eventRange.range, dayRanges)

      for (let rawSeg of rawSegs) {
        segs.push(
          assignTo({}, rawSeg, {
            component,
            eventRange,
            col: resourceDayTable.computeCol(rawSeg.col, resourceI)
          })
        )
      }
    }
  }

  return segs
}
