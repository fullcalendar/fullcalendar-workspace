import { renderer, mapHash, DateSpan, DateComponent, DateProfile, EventStore, EventUiHash, EventInteractionState, ComponentContext, memoize, DateRange, DateMarker, Hit, DomLocation } from '@fullcalendar/core'
import { DayTimeColsSlicer, TimeCols, TimeColsRenderProps, buildDayRanges, TimeColsSeg } from '@fullcalendar/timegrid'
import { AbstractResourceDayTableModel, VResourceSplitter, VResourceJoiner } from '@fullcalendar/resource-common'

export interface ResourceTimeGridProps extends DomLocation {
  dateProfile: DateProfile | null
  resourceDayTableModel: AbstractResourceDayTableModel
  businessHours: EventStore
  eventStore: EventStore
  eventUiBases: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  renderProps: TimeColsRenderProps
}

export default class ResourceTimeGrid extends DateComponent<ResourceTimeGridProps> {

  allowAcrossResources = false

  private buildDayRanges = memoize(buildDayRanges)
  private registerInteractive = renderer(this._registerInteractive, this._unregisterInteractive)
  private renderTimeCols = renderer(TimeCols)

  private dayRanges: DateRange[] // for renderNowIndicator
  private splitter = new VResourceSplitter()
  private slicers: { [resourceId: string]: DayTimeColsSlicer } = {}
  private joiner = new ResourceTimeGridJoiner()
  timeCols: TimeCols


  render(props: ResourceTimeGridProps, context: ComponentContext) {
    let { dateEnv } = context
    let { dateProfile, resourceDayTableModel } = props

    let dayRanges = this.dayRanges = this.buildDayRanges(resourceDayTableModel.dayTableModel, dateProfile, dateEnv)
    let splitProps = this.splitter.splitProps(props)

    this.slicers = mapHash(splitProps, (split, resourceId) => {
      return this.slicers[resourceId] || new DayTimeColsSlicer()
    })

    let slicedProps = mapHash(this.slicers, (slicer, resourceId) => {
      return slicer.sliceProps(
        splitProps[resourceId],
        dateProfile,
        null,
        context.calendar,
        dayRanges
      )
    })

    this.allowAcrossResources = dayRanges.length === 1

    let timeCols = this.renderTimeCols({
      ...this.joiner.joinProps(slicedProps, resourceDayTableModel),
      dateProfile,
      cells: resourceDayTableModel.cells[0],
      renderProps: props.renderProps
    })

    this.registerInteractive({ el: timeCols.rootEl })

    this.timeCols = timeCols

    return timeCols
  }


  _registerInteractive({ el }: { el: HTMLElement }, context: ComponentContext) {
    context.calendar.registerInteractiveComponent(this, { el })
  }


  _unregisterInteractive(funcProps: void, context: ComponentContext) {
    context.calendar.unregisterInteractiveComponent(this)
  }


  updateSize(isResize: boolean) {
    this.timeCols.updateSize(isResize)
  }


  getNowIndicatorUnit() {
    return this.timeCols.getNowIndicatorUnit()
  }


  renderNowIndicator(date: DateMarker) {
    let { timeCols } = this
    let { resourceDayTableModel } = this.props

    let nonResourceSegs = this.slicers[''].sliceNowDate(date, this.context.calendar, this.dayRanges)
    let segs = this.joiner.expandSegs(resourceDayTableModel, nonResourceSegs)

    timeCols.renderNowIndicator(segs, date)
  }


  unrenderNowIndicator() {
    this.timeCols.unrenderNowIndicator()
  }


  buildPositionCaches() {
    this.timeCols.buildPositionCaches()
  }


  queryHit(positionLeft: number, positionTop: number): Hit {
    let rawHit = this.timeCols.positionToHit(positionLeft, positionTop)

    if (rawHit) {
      return {
        component: this,
        dateSpan: {
          range: rawHit.dateSpan.range,
          allDay: rawHit.dateSpan.allDay,
          resourceId: this.props.resourceDayTableModel.cells[0][rawHit.col].resource.id
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


class ResourceTimeGridJoiner extends VResourceJoiner<TimeColsSeg> {

  transformSeg(seg: TimeColsSeg, resourceDayTable: AbstractResourceDayTableModel, resourceI: number) {
    return [
      {
        ...seg,
        col: resourceDayTable.computeCol(seg.col, resourceI)
      }
    ]
  }

}
