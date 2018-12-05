import { memoizeSlicer, Hit, OffsetTracker, sliceDayGridSegs, DateSpan, DayGrid, DateComponent, DateProfile, EventStore, EventUiHash, EventInteractionState, ComponentContext, DayGridSeg, Duration, DateRange, sliceBusinessHours, reselector, SimpleDayGridSlicerArgs } from "fullcalendar"
import { AbstractResourceDayTable } from '../common/resource-day-table'

export interface ResourceDayGridProps {
  dateProfile: DateProfile | null
  resourceDayTable: AbstractResourceDayTable
  businessHours: EventStore
  eventStore: EventStore
  eventUiBases: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  isRigid: boolean
  nextDayThreshold: Duration
}

interface ResourceDayGridSlicerArgs extends SimpleDayGridSlicerArgs {
  resourceDayTable: AbstractResourceDayTable
}

export default class ResourceDayGrid extends DateComponent<ResourceDayGridProps> {

  dayGrid: DayGrid

  offsetTracker: OffsetTracker

  private slicer = memoizeSlicer(new ResourceDayTableSlicer<DayGridSeg, ResourceDayGridSlicerArgs>(sliceDayGridSegs, massageSeg))

  constructor(context: ComponentContext, dayGrid: DayGrid) {
    super(context, dayGrid.el)

    this.dayGrid = dayGrid
  }

  render(props: ResourceDayGridProps) {
    let { slicer, isRtl } = this
    let { dateProfile, resourceDayTable, nextDayThreshold } = props

    let slicerArgs: ResourceDayGridSlicerArgs = {
      component: this.dayGrid,
      resourceDayTable,
      dayTable: resourceDayTable.dayTable,
      isRtl
    }

    let segRes = slicer.eventStoreToSegs(props.eventStore, props.eventUiBases, dateProfile, nextDayThreshold, slicerArgs)

    this.dayGrid.receiveProps({
      dateProfile: props.dateProfile,
      cells: props.resourceDayTable.cells,
      businessHourSegs: slicer.businessHoursToSegs(props.businessHours, dateProfile, nextDayThreshold, slicerArgs),
      bgEventSegs: segRes.bg,
      fgEventSegs: segRes.fg,
      dateSelectionSegs: slicer.selectionToSegs(props.dateSelection, props.eventUiBases, slicerArgs),
      eventSelection: props.eventSelection,
      eventDrag: slicer.buildEventDrag(props.eventDrag, props.eventUiBases, dateProfile, nextDayThreshold, slicerArgs),
      eventResize: slicer.buildEventResize(props.eventResize, props.eventUiBases, dateProfile, nextDayThreshold, slicerArgs),
      isRigid: props.isRigid
    })
  }

  prepareHits() {
    this.offsetTracker = new OffsetTracker(this.dayGrid.el)
  }

  releaseHits() {
    this.offsetTracker.destroy()
  }

  queryHit(leftOffset, topOffset): Hit {
    let { offsetTracker } = this

    if (offsetTracker.isWithinClipping(leftOffset, topOffset)) {
      let originLeft = offsetTracker.computeLeft()
      let originTop = offsetTracker.computeTop()

      let rawHit = this.dayGrid.positionToHit(
        leftOffset - originLeft,
        topOffset - originTop
      )

      if (rawHit) {
        return {
          component: this.dayGrid,
          dateSpan: {
            range: rawHit.dateSpan.range,
            allDay: rawHit.dateSpan.allDay,
            resourceId: this.props.resourceDayTable.cells[rawHit.row][rawHit.col].resource.id
          },
          dayEl: rawHit.dayEl,
          rect: {
            left: rawHit.relativeRect.left + originLeft,
            right: rawHit.relativeRect.right + originLeft,
            top: rawHit.relativeRect.top + originTop,
            bottom: rawHit.relativeRect.bottom + originTop
          },
          layer: 0
        }
      }
    }
  }

}

ResourceDayGrid.prototype.isInteractable = true


function massageSeg(seg: DayGridSeg, resourceId: string, resourceDayTable: AbstractResourceDayTable) {
  let resourceI = resourceDayTable.resourceIndex.indicesById[resourceId]

  if (resourceI) {
    seg.leftCol = resourceDayTable.computeCol(seg.leftCol, resourceI),
    seg.rightCol = resourceDayTable.computeCol(seg.rightCol, resourceI)
  } else {
    return false
  }
}
