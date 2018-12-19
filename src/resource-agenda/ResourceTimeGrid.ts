import { mapHash, OffsetTracker, TimeGridSlicer, DateSpan, DateComponent, TimeGrid, DateProfile, EventStore, EventUiHash, EventInteractionState, ComponentContext, memoize, DateRange, TimeGridSeg, DateMarker, Hit, buildDayRanges } from "fullcalendar"
import { AbstractResourceDayTable, VResourceSplitter, VResourceJoiner } from '../common/resource-day-table'

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

export default class ResourceTimeGrid extends DateComponent<ResourceTimeGridProps> {

  timeGrid: TimeGrid
  offsetTracker: OffsetTracker

  private buildDayRanges = memoize(buildDayRanges)
  private dayRanges: DateRange[] // for renderNowIndicator
  private splitter = new VResourceSplitter()
  private slicers: { [resourceId: string]: TimeGridSlicer } = {}
  private joiner = new ResourceTimeGridJoiner()

  constructor(context: ComponentContext, timeGrid: TimeGrid) {
    super(context, timeGrid.el)

    this.timeGrid = timeGrid
  }

  render(props: ResourceTimeGridProps) {
    let { timeGrid } = this
    let { dateProfile, resourceDayTable } = props

    let dayRanges = this.dayRanges = this.buildDayRanges(resourceDayTable.dayTable, dateProfile, this.dateEnv)
    let splitProps = this.splitter.splitProps(props)

    this.slicers = mapHash(splitProps, (split, resourceId) => {
      return this.slicers[resourceId] || new TimeGridSlicer()
    })

    let slicedProps = mapHash(this.slicers, (slicer, resourceId) => {
      return slicer.sliceProps(
        splitProps[resourceId],
        dateProfile,
        null,
        timeGrid,
        dayRanges
      )
    })

    // HACK
    ;(timeGrid as any).allowAcrossResources = dayRanges.length === 1

    timeGrid.receiveProps({
      ...this.joiner.joinProps(slicedProps, resourceDayTable),
      dateProfile,
      cells: resourceDayTable.cells[0]
    })
  }

  renderNowIndicator(date: DateMarker) {
    let { timeGrid } = this
    let { resourceDayTable } = this.props

    let nonResourceSegs = this.slicers[''].sliceNowDate(date, timeGrid, this.dayRanges)
    let segs = this.joiner.expandSegs(resourceDayTable, nonResourceSegs)

    timeGrid.renderNowIndicator(segs, date)
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


class ResourceTimeGridJoiner extends VResourceJoiner<TimeGridSeg> {

  transformSeg(seg: TimeGridSeg, resourceDayTable: AbstractResourceDayTable, resourceI: number) {
    return [
      {
        ...seg,
        col: resourceDayTable.computeCol(seg.col, resourceI)
      }
    ]
  }

}
