import { Hit, OffsetTracker, sliceDayGridSegs, DateSpan, DayGrid, DateComponent, assignTo, DateProfile, EventStore, EventUiHash, EventInteractionUiState, ComponentContext, DayGridSeg, Duration, DateRange, sliceBusinessHours, reselector } from "fullcalendar"
import { AbstractResourceDayTable } from '../common/resource-day-table'
import { ResourceAwareSlicer } from '../common/resource-aware-slicing'

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

export default class ResourceDayGrid extends DateComponent<ResourceDayGridProps> {

  dayGrid: DayGrid

  offsetTracker: OffsetTracker

  private slicer = new ResourceAwareSlicer(sliceSegs)
  private sliceResourceBusinessHours = reselector(sliceResourceBusinessHours)

  constructor(context: ComponentContext, dayGrid: DayGrid) {
    super(context, dayGrid.el)

    this.dayGrid = dayGrid
    this.slicer.component = dayGrid
  }

  render(props: ResourceDayGridProps) {
    let { slicer, isRtl } = this
    let { dateProfile, resourceDayTable, nextDayThreshold } = props

    this.dayGrid.receiveProps({
      dateProfile: props.dateProfile,
      cells: props.resourceDayTable.cells,
      businessHourSegs: this.sliceResourceBusinessHours(resourceDayTable, dateProfile, nextDayThreshold, props.businessHours, this.dayGrid),
      eventSegs: slicer.eventStoreToSegs(props.eventStore, props.eventUis, dateProfile, nextDayThreshold, resourceDayTable, isRtl),
      dateSelectionSegs: slicer.selectionToSegs(props.dateSelection, resourceDayTable, isRtl),
      eventSelection: props.eventSelection,
      eventDrag: slicer.buildEventDrag(props.eventDrag, dateProfile, nextDayThreshold, resourceDayTable, isRtl),
      eventResize: slicer.buildEventResize(props.eventResize, dateProfile, nextDayThreshold, resourceDayTable, isRtl),
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
            resource: this.props.resourceDayTable.cells[rawHit.row][rawHit.col].resource
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


function sliceSegs(range: DateRange, resourceIds: string[], resourceDayTable: AbstractResourceDayTable, isRtl: boolean): DayGridSeg[] {

  if (!resourceIds.length) {
    resourceIds = resourceDayTable.resourceIndex.ids
  }

  let rawSegs = sliceDayGridSegs(range, resourceDayTable.dayTable, isRtl)
  let segs = []

  for (let rawSeg of rawSegs) {

    for (let resourceId of resourceIds) {
      let resourceI = resourceDayTable.resourceIndex.indicesById[resourceId]

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


function sliceResourceBusinessHours(resourceDayTable: AbstractResourceDayTable, dateProfile: DateProfile, nextDayThreshold: Duration, fallbackBusinessHours: EventStore, component: DayGrid) {
  let segs = []

  for (let resource of resourceDayTable.resources) {
    let businessHours = resource.businessHours || fallbackBusinessHours
    let eventRanges = sliceBusinessHours(
      businessHours,
      dateProfile.activeRange,
      nextDayThreshold,
      component.calendar
    )

    let resourceI = resourceDayTable.resourceIndex.indicesById[resource.id]

    for (let eventRange of eventRanges) {
      let rawSegs = sliceDayGridSegs(eventRange.range, resourceDayTable.dayTable, component.isRtl)

      for (let rawSeg of rawSegs) {
        segs.push(
          assignTo({}, rawSeg, {
            component,
            eventRange,
            leftCol: resourceDayTable.computeCol(rawSeg.leftCol, resourceI),
            rightCol: resourceDayTable.computeCol(rawSeg.rightCol, resourceI)
          })
        )
      }
    }
  }

  return segs
}
