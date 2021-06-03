import { mapHash, Hit, DateSpan, DateComponent, DateProfile, EventStore, EventUiHash, EventInteractionState, ComponentContext, Duration } from '@fullcalendar/core'
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

  private splitter = new VResourceSplitter()
  private slicers: { [resourceId: string]: DayGridSlicer } = {}
  private joiner = new ResourceDayGridJoiner()

  constructor(dayGrid: DayGrid) {
    super(dayGrid.el)

    this.dayGrid = dayGrid
  }

  firstContext(context: ComponentContext) {
    context.calendar.registerInteractiveComponent(this, {
      el: this.dayGrid.el
    })
  }

  destroy() {
    super.destroy()

    this.context.calendar.unregisterInteractiveComponent(this)
  }

  render(props: ResourceDayGridProps, context: ComponentContext) {
    let { dayGrid } = this
    let { dateProfile, resourceDayTable, nextDayThreshold } = props

    let splitProps = this.splitter.splitProps(props)

    this.slicers = mapHash(splitProps, (split, resourceId) => {
      return this.slicers[resourceId] || new DayGridSlicer()
    })

    dayGrid.receiveContext(context) // hack because sliceProps expects component to have context

    let slicedProps = mapHash(this.slicers, (slicer, resourceId) => {
      return slicer.sliceProps(
        splitProps[resourceId],
        dateProfile,
        nextDayThreshold,
        context.calendar,
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
    }, context)
  }

  buildPositionCaches() {
    this.dayGrid.buildPositionCaches()
  }

  queryHit(positionLeft: number, positionTop: number): Hit {
    let rawHit = this.dayGrid.positionToHit(positionLeft, positionTop)

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
          left: rawHit.relativeRect.left,
          right: rawHit.relativeRect.right,
          top: rawHit.relativeRect.top,
          bottom: rawHit.relativeRect.bottom
        },
        layer: 0
      }
    }
  }

}


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
