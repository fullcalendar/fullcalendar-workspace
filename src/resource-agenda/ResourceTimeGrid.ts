import { memoizeSlicer, OffsetTracker, addMs, DateSpan, DateComponent, TimeGrid, DateProfile, EventStore, EventUiHash, EventInteractionUiState, ComponentContext, reselector, buildDayRanges, sliceTimeGridSegs, DateRange, assignTo, TimeGridSeg, sliceBusinessHours, DateMarker, Hit } from "fullcalendar"
import { AbstractResourceDayTable } from '../common/resource-day-table'
import { ResourceAwareSlicer } from '../common/resource-aware-slicing'

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

export default class ResourceTimeGrid extends DateComponent<ResourceTimeGridProps> {

  timeGrid: TimeGrid

  offsetTracker: OffsetTracker

  private buildDayRanges = reselector(buildDayRanges)
  private slicer = memoizeSlicer(new ResourceAwareSlicer(sliceSegs, () => { return this.timeGrid }))
  private sliceResourceBusinessHours = reselector(sliceResourceBusinessHours)
  private dayRanges: DateRange[]

  constructor(context: ComponentContext, timeGrid: TimeGrid) {
    super(context, timeGrid.el)

    this.timeGrid = timeGrid
  }

  render(props: ResourceTimeGridProps) {
    let { slicer } = this
    let { dateProfile, resourceDayTable } = props

    let dayRanges = this.dayRanges =
      this.buildDayRanges(resourceDayTable.dayTable, dateProfile, this.dateEnv)

    let segRes = slicer.eventStoreToSegs(props.eventStore, props.eventUis, dateProfile, null, resourceDayTable, dayRanges)

    this.timeGrid.receiveProps({
      dateProfile: props.dateProfile,
      cells: props.resourceDayTable.cells[0],
      businessHourSegs: this.sliceResourceBusinessHours(resourceDayTable, dateProfile, dayRanges, props.businessHours, this.timeGrid),
      fgEventSegs: segRes.fg,
      bgEventSegs: segRes.bg,
      dateSelectionSegs: slicer.selectionToSegs(props.dateSelection, resourceDayTable, dayRanges),
      eventSelection: props.eventSelection,
      eventDrag: slicer.buildEventDrag(props.eventDrag, dateProfile, null, resourceDayTable, dayRanges),
      eventResize: slicer.buildEventResize(props.eventResize, dateProfile, null, resourceDayTable, dayRanges)
    })
  }

  renderNowIndicator(date: DateMarker) {
    this.timeGrid.renderNowIndicator( // TODO: have slicer do this?
      // seg system might be overkill, but it handles scenario where line needs to be rendered
      //  more than once because of columns with the same date (resource columns for example)
      sliceSegs({
        start: date,
        end: addMs(date, 1) // protect against null range
      }, [], this.props.resourceDayTable, this.dayRanges),
      date
    )
  }

  prepareHits() {
    this.offsetTracker = new OffsetTracker(this.timeGrid.el)
  }

  releaseHits() {
    this.offsetTracker.destroy()
  }

  queryHit(leftOffset, topOffset): Hit {
    let { offsetTracker } = this

    if (offsetTracker.isWithinClipping(leftOffset, topOffset)) {
      let originLeft = offsetTracker.computeLeft()
      let originTop = offsetTracker.computeTop()

      let rawHit = this.timeGrid.positionToHit(
        leftOffset - originLeft,
        topOffset - originTop
      )

      if (rawHit) {
        return {
          component: this.timeGrid,
          dateSpan: {
            range: rawHit.dateSpan.range,
            allDay: rawHit.dateSpan.allDay,
            resourceId: this.props.resourceDayTable.cells[0][rawHit.col].resource.id
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

ResourceTimeGrid.prototype.isInteractable = true


function sliceSegs(range: DateRange, resourceIds: string[], resourceDayTable: AbstractResourceDayTable, dayRanges: DateRange[]): TimeGridSeg[] {

  if (!resourceIds.length) {
    resourceIds = resourceDayTable.resourceIndex.ids
  }

  let rawSegs = sliceTimeGridSegs(range, dayRanges)
  let segs = []

  for (let rawSeg of rawSegs) {

    for (let resourceId of resourceIds) {
      let resourceI = resourceDayTable.resourceIndex.indicesById[resourceId]

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

    let resourceI = resourceDayTable.resourceIndex.indicesById[resource.id]

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
