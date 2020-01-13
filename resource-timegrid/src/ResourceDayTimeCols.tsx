import {
  h, createRef, VNode, subrenderer,
  mapHash, DateSpan, DateComponent, DateProfile, EventStore, EventUiHash, EventInteractionState, ComponentContext, memoize, DateRange, DateMarker, Hit, NowTimer
} from '@fullcalendar/core'
import { DayTimeColsSlicer, TimeCols, buildDayRanges, TimeColsSeg, TIME_COLS_NOW_INDICATOR_UNIT } from '@fullcalendar/timegrid'
import { AbstractResourceDayTableModel, VResourceSplitter, VResourceJoiner } from '@fullcalendar/resource-common'


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
  colGroupNode: VNode
  renderBgIntro: () => VNode[]
  renderIntro: () => VNode[]
}

interface ResourceDayTimeColsState {
  nowIndicatorDate: DateMarker
}


export default class ResourceDayTimeCols extends DateComponent<ResourceDayTimeColsProps, ResourceDayTimeColsState> {

  allowAcrossResources = false

  private buildDayRanges = memoize(buildDayRanges)
  private updateNowTimer = subrenderer(NowTimer)
  private dayRanges: DateRange[] // for now indicator
  private splitter = new VResourceSplitter()
  private slicers: { [resourceId: string]: DayTimeColsSlicer } = {}
  private joiner = new ResourceDayTimeColsJoiner()
  private timeColsRef = createRef<TimeCols>()

  get timeCols() { return this.timeColsRef.current } // used for view's computeDateScroll :(


  render(props: ResourceDayTimeColsProps, state: ResourceDayTimeColsState, context: ComponentContext) {
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
        colGroupNode={props.colGroupNode}
        renderBgIntro={props.renderBgIntro}
        renderIntro={props.renderIntro}
        nowIndicatorDate={state.nowIndicatorDate}
        nowIndicatorSegs={state.nowIndicatorDate && this.buildNowIndicatorSegs(state.nowIndicatorDate)}
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


  componentDidMount() {
    this.subrender()
  }


  componentDidUpdate() {
    this.subrender()
  }


  componentWillUnmount() {
    this.subrenderDestroy()
  }


  subrender() {
    this.updateNowTimer({
      enabled: this.context.options.nowIndicator,
      unit: TIME_COLS_NOW_INDICATOR_UNIT,
      callback: this.handleNowDate
    })
  }


  handleNowDate = (date: DateMarker) => {
    this.setState({
      nowIndicatorDate: date
    })
  }


  buildNowIndicatorSegs(date: DateMarker) {
    let nonResourceSegs = this.slicers[''].sliceNowDate(date, this.context.calendar, this.dayRanges)
    return this.joiner.expandSegs(this.props.resourceDayTableModel, nonResourceSegs)
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
