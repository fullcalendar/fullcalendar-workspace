import {
  createElement, createRef, VNode,
  mapHash, DateSpan, DateComponent, EventStore, EventUiHash, EventInteractionState, memoize, DateRange,
  DateMarker, Hit, CssDimValue, NowTimer, Duration, DateProfile,
} from '@fullcalendar/common'
import { DayTimeColsSlicer, TimeCols, buildDayRanges, TimeSlatMeta, TimeColsSlatsCoords } from '@fullcalendar/timegrid'
import { AbstractResourceDayTableModel, VResourceSplitter } from '@fullcalendar/resource-common'
import { ResourceDayTimeColsJoiner } from './ResourceDayTimeColsJoiner'

export interface ResourceDayTimeColsProps {
  dateProfile: DateProfile
  resourceDayTableModel: AbstractResourceDayTableModel
  axis: boolean
  slotDuration: Duration
  slatMetas: TimeSlatMeta[]
  businessHours: EventStore
  eventStore: EventStore
  eventUiBases: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  tableColGroupNode: VNode
  tableMinWidth: CssDimValue
  clientWidth: number | null
  clientHeight: number | null
  expandRows: boolean
  onScrollTopRequest?: (scrollTop: number) => void
  forPrint: boolean
  onSlatCoords?: (slatCoords: TimeColsSlatsCoords) => void
}

export class ResourceDayTimeCols extends DateComponent<ResourceDayTimeColsProps> {
  private buildDayRanges = memoize(buildDayRanges)
  private dayRanges: DateRange[] // for now indicator
  private splitter = new VResourceSplitter()
  private slicers: { [resourceId: string]: DayTimeColsSlicer } = {}
  private joiner = new ResourceDayTimeColsJoiner()
  private timeColsRef = createRef<TimeCols>()

  render() {
    let { props, context } = this
    let { dateEnv, options } = context
    let { dateProfile, resourceDayTableModel } = props

    let dayRanges = this.dayRanges = this.buildDayRanges(resourceDayTableModel.dayTableModel, dateProfile, dateEnv)
    let splitProps = this.splitter.splitProps(props)

    this.slicers = mapHash(splitProps, (split, resourceId) => this.slicers[resourceId] || new DayTimeColsSlicer())
    let slicedProps = mapHash(this.slicers, (slicer, resourceId) => slicer.sliceProps(
      splitProps[resourceId],
      dateProfile,
      null,
      context,
      dayRanges,
    ))

    return ( // TODO: would move this further down hierarchy, but sliceNowDate needs it
      <NowTimer unit={options.nowIndicator ? 'minute' : 'day'}>
        {(nowDate: DateMarker, todayRange: DateRange) => (
          <TimeCols
            ref={this.timeColsRef}
            {...this.joiner.joinProps(slicedProps, resourceDayTableModel)}
            dateProfile={dateProfile}
            axis={props.axis}
            slotDuration={props.slotDuration}
            slatMetas={props.slatMetas}
            cells={resourceDayTableModel.cells[0]}
            tableColGroupNode={props.tableColGroupNode}
            tableMinWidth={props.tableMinWidth}
            clientWidth={props.clientWidth}
            clientHeight={props.clientHeight}
            expandRows={props.expandRows}
            nowDate={nowDate}
            nowIndicatorSegs={options.nowIndicator && this.buildNowIndicatorSegs(nowDate)}
            todayRange={todayRange}
            onScrollTopRequest={props.onScrollTopRequest}
            forPrint={props.forPrint}
            onSlatCoords={props.onSlatCoords}
            isHitComboAllowed={this.isHitComboAllowed}
          />
        )}
      </NowTimer>
    )
  }

  isHitComboAllowed = (hit0: Hit, hit1: Hit) => {
    let allowAcrossResources = this.dayRanges.length === 1
    return allowAcrossResources || hit0.dateSpan.resourceId === hit1.dateSpan.resourceId
  }

  buildNowIndicatorSegs(date: DateMarker) {
    let nonResourceSegs = this.slicers[''].sliceNowDate(date, this.context, this.dayRanges)
    return this.joiner.expandSegs(this.props.resourceDayTableModel, nonResourceSegs)
  }
}
