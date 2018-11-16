import { DateSpan, Component, TimeGrid, DateProfile, EventStore, EventUiHash, EventInteractionUiState, ComponentContext, reselector, buildDayRanges, sliceTimeGridSegs, DateRange, assignTo, TimeGridSeg } from "fullcalendar"
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

  constructor(context: ComponentContext, timeGrid: TimeGrid) {
    super(context)

    this.timeGrid = timeGrid
  }

  render(props: ResourceTimeGridProps) {
    let { slicer } = this
    let { dateProfile, resourceDayTable } = props

    let dayRanges = this.buildDayRanges(resourceDayTable.dayTable, dateProfile, this.dateEnv)

    this.timeGrid.receiveProps({
      dateProfile: props.dateProfile,
      cells: props.resourceDayTable.cells[0],
      businessHourSegs: slicer.businessHoursToSegs(props.businessHours, dateProfile, null, resourceDayTable, dayRanges),
      eventSegs: slicer.eventStoreToSegs(props.eventStore, props.eventUis, dateProfile, null, resourceDayTable, dayRanges),
      dateSelectionSegs: slicer.selectionToSegs(props.dateSelection, resourceDayTable, dayRanges),
      eventSelection: props.eventSelection,
      eventDrag: slicer.buildEventDrag(props.eventDrag, dateProfile, null, resourceDayTable, dayRanges),
      eventResize: slicer.buildEventResize(props.eventResize, dateProfile, null, resourceDayTable, dayRanges)
    })
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
