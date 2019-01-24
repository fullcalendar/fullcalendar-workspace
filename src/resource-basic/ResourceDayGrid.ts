import { mapHash, Hit, OffsetTracker, DateSpan, DateComponent, DateProfile, EventStore, EventUiHash, EventInteractionState, ComponentContext, Duration } from '@fullcalendar/core'
import { DayGridSlicer, DayGrid, DayGridSeg } from '@fullcalendar/daygrid'
import { AbstractResourceDayTable, VResourceSplitter, VResourceJoiner } from '@fullcalendar/resource-common'

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

export default class ResourceDayGrid extends DateComponent<ResourceDayGridProps> {

  dayGrid: DayGrid
  offsetTracker: OffsetTracker

  private splitter = new VResourceSplitter()
  private slicers: { [resourceId: string]: DayGridSlicer } = {}
  private joiner = new ResourceDayGridJoiner()

  constructor(context: ComponentContext, dayGrid: DayGrid) {
    super(context, dayGrid.el)

    this.dayGrid = dayGrid
  }

  render(props: ResourceDayGridProps) {
    let { dayGrid } = this
    let { dateProfile, resourceDayTable, nextDayThreshold } = props

    let splitProps = this.splitter.splitProps(props)

    this.slicers = mapHash(splitProps, (split, resourceId) => {
      return this.slicers[resourceId] || new DayGridSlicer()
    })

    let slicedProps = mapHash(this.slicers, (slicer, resourceId) => {
      return slicer.sliceProps(
        splitProps[resourceId],
        dateProfile,
        nextDayThreshold,
        dayGrid,
        resourceDayTable.dayTable
      )
    })

    // HACK
    ;(dayGrid as any).allowAcrossResources = resourceDayTable.dayTable.colCnt === 1

    dayGrid.receiveProps({
      ...this.joiner.joinProps(slicedProps, resourceDayTable),
      dateProfile,
      cells: resourceDayTable.cells,
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


class ResourceDayGridJoiner extends VResourceJoiner<DayGridSeg> {

  transformSeg(seg: DayGridSeg, resourceDayTable: AbstractResourceDayTable, resourceI: number): DayGridSeg[] {
    let colRanges = resourceDayTable.computeColRanges(seg.firstCol, seg.lastCol, resourceI)

    return colRanges.map(function(colRange) {
      return {
        ...seg,
        ...colRange,
        isStart: seg.isStart && colRange.isStart,
        isEnd: seg.isEnd && colRange.isEnd
      }
    })
  }

}
