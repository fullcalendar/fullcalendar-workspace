import { SimpleTimeGridSlicerArgs, memoizeSlicer, OffsetTracker, DateSpan, DateComponent, TimeGrid, DateProfile, EventStore, EventUiHash, EventInteractionState, ComponentContext, reselector, buildDayRanges, sliceTimeGridSegs, DateRange, TimeGridSeg, DateMarker, Hit } from "fullcalendar"
import { AbstractResourceDayTable } from '../common/resource-day-table'

export interface ResourceTimeGridProps {
  dateProfile: DateProfile | null
  resourceDayTable: AbstractResourceDayTable
  businessHours: EventStore
  eventStore: EventStore
  eventUiBases: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
}

interface ResourceDayGridSlicerArgs extends SimpleTimeGridSlicerArgs {
  resourceDayTable: AbstractResourceDayTable
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

    let slicerArgs: ResourceDayGridSlicerArgs = {
      component: this.timeGrid,
      resourceDayTable,
      dayRanges: this.buildDayRanges(resourceDayTable.dayTable, dateProfile, this.dateEnv)
    }

    let segRes = slicer.eventStoreToSegs(props.eventStore, props.eventUiBases, dateProfile, null, slicerArgs)

    this.timeGrid.receiveProps({
      dateProfile: props.dateProfile,
      cells: props.resourceDayTable.cells[0],
      businessHourSegs: slicer.businessHoursToSegs(props.businessHours, dateProfile, null, slicerArgs),
      fgEventSegs: segRes.fg,
      bgEventSegs: segRes.bg,
      dateSelectionSegs: slicer.selectionToSegs(props.dateSelection, props.eventUiBases, slicerArgs),
      eventSelection: props.eventSelection,
      eventDrag: slicer.buildEventDrag(props.eventDrag, props.eventUiBases, dateProfile, null, slicerArgs),
      eventResize: slicer.buildEventResize(props.eventResize, props.eventUiBases, dateProfile, null, slicerArgs)
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


function massageSeg(seg: TimeGridSeg, resourceId: string, resourceDayTable: AbstractResourceDayTable) {
  let resourceI = resourceDayTable.resourceIndex.indicesById[resourceId]

  if (resourceI) {
    seg.col = resourceDayTable.computeCol(seg.col, resourceI)
  } else {
    return false
  }
}
