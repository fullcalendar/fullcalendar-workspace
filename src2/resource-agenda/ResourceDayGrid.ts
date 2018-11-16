import { sliceDayGridSegs, DateSpan, DayGrid, Component, assignTo, DateProfile, EventStore, EventUiHash, EventInteractionUiState, ComponentContext, DayGridSeg, Duration, DateRange } from "fullcalendar"
import { AbstractResourceDayTable } from './resource-day-table'
import { ResourceAwareSlicer } from './resource-aware-slicing'

export interface ResourceDayGridProps {
  dateProfile: DateProfile | null
  resourceDayTable: AbstractResourceDayTable
  businessHours: EventStore
  eventStore: EventStore
  eventUis: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionUiState | null
  eventResize: EventInteractionUiState | null
  isRigid: boolean
  nextDayThreshold: Duration
}

export default class ResourceDayGrid extends Component<ResourceDayGridProps> {

  dayGrid: DayGrid

  private slicer = new ResourceAwareSlicer(sliceSegs)

  constructor(context: ComponentContext, dayGrid: DayGrid) {
    super(context)

    this.dayGrid = dayGrid
    this.slicer.component = dayGrid
  }

  render(props: ResourceDayGridProps) {
    let { slicer, isRtl } = this
    let { dateProfile, resourceDayTable, nextDayThreshold } = props

    this.dayGrid.receiveProps({
      dateProfile: props.dateProfile,
      cells: props.resourceDayTable.cells,
      businessHourSegs: slicer.businessHoursToSegs(props.businessHours, dateProfile, nextDayThreshold, resourceDayTable, isRtl),
      eventSegs: slicer.eventStoreToSegs(props.eventStore, props.eventUis, dateProfile, nextDayThreshold, resourceDayTable, isRtl),
      dateSelectionSegs: slicer.selectionToSegs(props.dateSelection, resourceDayTable, isRtl),
      eventSelection: props.eventSelection,
      eventDrag: slicer.buildEventDrag(props.eventDrag, dateProfile, nextDayThreshold, resourceDayTable, isRtl),
      eventResize: slicer.buildEventResize(props.eventResize, dateProfile, nextDayThreshold, resourceDayTable, isRtl),
      isRigid: props.isRigid
    })
  }

}

function sliceSegs(range: DateRange, resourceIds: string[], resourceDayTable: AbstractResourceDayTable, isRtl: boolean): DayGridSeg[] {

  if (!resourceIds.length) {
    resourceIds = resourceDayTable.resourceIndex.publicIds
  }

  let rawSegs = sliceDayGridSegs(range, resourceDayTable.dayTable, isRtl)
  let segs = []

  for (let rawSeg of rawSegs) {

    for (let resourceId of resourceIds) {
      let resourceI = resourceDayTable.resourceIndex.indicesByPublicId[resourceId]

      if (resourceI != null) {
        segs.push(
          assignTo({}, rawSeg, {
            leftCol: resourceDayTable.computeCol(rawSeg.leftCol, resourceI),
            rightCol: resourceDayTable.computeCol(rawSeg.rightCol, resourceI)
          })
        )
      }
    }
  }

  return segs
}
