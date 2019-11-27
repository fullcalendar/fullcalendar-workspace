import { mapHash, DateSpan, DateComponent, DateProfile, EventStore, EventUiHash, EventInteractionState, ComponentContext, memoize, DateRange, DateMarker, Hit } from '@fullcalendar/core'
import { DayTimeColsSlicer, TimeCols, buildDayRanges, TimeColsSeg } from '@fullcalendar/timegrid'
import { AbstractResourceDayTableModel, VResourceSplitter, VResourceJoiner } from '@fullcalendar/resource-common'
import { h, createRef, VNode } from 'preact'


export interface ResourceDayTimeColsProps {
  dateProfile: DateProfile | null
  resourceDayTableModel: AbstractResourceDayTableModel
  businessHours: EventStore
  eventStore: EventStore
  eventUiBases: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  renderBgIntro: () => VNode[]
  renderIntro: () => VNode[]
}


export default class ResourceDayTimeCols extends DateComponent<ResourceDayTimeColsProps> {

  allowAcrossResources = false

  private buildDayRanges = memoize(buildDayRanges)
  private dayRanges: DateRange[] // for renderNowIndicator
  private splitter = new VResourceSplitter()
  private slicers: { [resourceId: string]: DayTimeColsSlicer } = {}
  private joiner = new ResourceDayTimeColsJoiner()
  private timeColsRef = createRef<TimeCols>()

  get timeCols() { return this.timeColsRef.current }


  render(props: ResourceDayTimeColsProps, state: {}, context: ComponentContext) {
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

    return (
      <TimeCols
        ref={this.timeColsRef}
        rootElRef={this.handleRootEl}
        {...this.joiner.joinProps(slicedProps, resourceDayTableModel)}
        dateProfile={dateProfile}
        cells={resourceDayTableModel.cells[0]}
        renderBgIntro={props.renderBgIntro}
        renderIntro={props.renderIntro}
      />
    )
  }


  handleRootEl = (rootEl: HTMLElement | null) => {
    let { calendar } = this.context

    if (rootEl) {
      calendar.registerInteractiveComponent(this, { el: rootEl })
    } else {
      calendar.unregisterInteractiveComponent(this)
    }
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


class ResourceDayTimeColsJoiner extends VResourceJoiner<TimeColsSeg> {

  transformSeg(seg: TimeColsSeg, resourceDayTable: AbstractResourceDayTableModel, resourceI: number) {
    return [
      {
        ...seg,
        col: resourceDayTable.computeCol(seg.col, resourceI)
      }
    ]
  }

}
