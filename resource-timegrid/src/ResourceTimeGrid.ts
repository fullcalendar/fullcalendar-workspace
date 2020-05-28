import { mapHash, DateSpan, DateComponent, DateProfile, EventStore, EventUiHash, EventInteractionState, ComponentContext, memoize, DateRange, DateMarker, Hit } from '@fullcalendar/core'
import { TimeGridSlicer, TimeGrid, buildDayRanges, TimeGridSeg } from '@fullcalendar/timegrid'
import { AbstractResourceDayTable, VResourceSplitter, VResourceJoiner } from '@fullcalendar/resource-common'

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

  private buildDayRanges = memoize(buildDayRanges)
  private dayRanges: DateRange[] // for renderNowIndicator
  private splitter = new VResourceSplitter()
  private slicers: { [resourceId: string]: TimeGridSlicer } = {}
  private joiner = new ResourceTimeGridJoiner()

  constructor(timeGrid: TimeGrid) {
    super(timeGrid.el)

    this.timeGrid = timeGrid
  }

  firstContext(context: ComponentContext) {
    context.calendar.registerInteractiveComponent(this, {
      el: this.timeGrid.el
    })
  }

  destroy() {
    this.context.calendar.unregisterInteractiveComponent(this)
  }

  render(props: ResourceTimeGridProps, context: ComponentContext) {
    let { timeGrid } = this
    let { dateEnv } = context
    let { dateProfile, resourceDayTable } = props

    let dayRanges = this.dayRanges = this.buildDayRanges(resourceDayTable.dayTable, dateProfile, dateEnv)
    let splitProps = this.splitter.splitProps(props)

    this.slicers = mapHash(splitProps, (split, resourceId) => {
      return this.slicers[resourceId] || new TimeGridSlicer()
    })

    timeGrid.receiveContext(context) // hack because sliceProps expects component to have context

    let slicedProps = mapHash(this.slicers, (slicer, resourceId) => {
      return slicer.sliceProps(
        splitProps[resourceId],
        dateProfile,
        null,
        context.calendar,
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
    }, context)
  }

  renderNowIndicator(date: DateMarker) {
    let { timeGrid } = this
    let { resourceDayTable } = this.props

    let nonResourceSegs = this.slicers[''].sliceNowDate(date, timeGrid, this.dayRanges)
    let segs = this.joiner.expandSegs(resourceDayTable, nonResourceSegs)

    timeGrid.renderNowIndicator(segs, date)
  }

  buildPositionCaches() {
    this.timeGrid.buildPositionCaches()
  }

  queryHit(positionLeft: number, positionTop: number): Hit {
    let rawHit = this.timeGrid.positionToHit(positionLeft, positionTop)

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
