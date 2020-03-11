import {
  h, createRef, VNode,
  mapHash, DateSpan, DateComponent, DateProfile, EventStore, EventUiHash, EventInteractionState, ComponentContext, memoize, DateRange, DateMarker, Hit, CssDimValue, NowTimer
} from '@fullcalendar/core'
import { DayTimeColsSlicer, TimeCols, buildDayRanges, TimeColsSeg } from '@fullcalendar/timegrid'
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
  tableColGroupNode: VNode
  tableMinWidth: CssDimValue
  clientWidth: CssDimValue
  clientHeight: CssDimValue
  vGrowRows: boolean
  onScrollTopRequest?: (scrollTop: number) => void
  forPrint: boolean
}


export default class ResourceDayTimeCols extends DateComponent<ResourceDayTimeColsProps> {

  allowAcrossResources = false

  private buildDayRanges = memoize(buildDayRanges)
  private dayRanges: DateRange[] // for now indicator
  private splitter = new VResourceSplitter()
  private slicers: { [resourceId: string]: DayTimeColsSlicer } = {}
  private joiner = new ResourceDayTimeColsJoiner()
  private timeColsRef = createRef<TimeCols>()


  render(props: ResourceDayTimeColsProps, state: {}, context: ComponentContext) {
    let { dateEnv, options } = context
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
      <NowTimer // TODO: would move this further down hierarchy, but sliceNowDate needs it
        unit={options.nowIndicator ? 'minute' : 'day'}
        content={(nowDate: DateMarker, todayRange: DateRange) => (
          <TimeCols
            ref={this.timeColsRef}
            rootElRef={this.handleRootEl}
            {...this.joiner.joinProps(slicedProps, resourceDayTableModel)}
            dateProfile={dateProfile}
            cells={resourceDayTableModel.cells[0]}
            tableColGroupNode={props.tableColGroupNode}
            tableMinWidth={props.tableMinWidth}
            clientWidth={props.clientWidth}
            clientHeight={props.clientHeight}
            vGrowRows={props.vGrowRows}
            nowDate={nowDate}
            nowIndicatorSegs={options.nowIndicator && this.buildNowIndicatorSegs(nowDate)}
            todayRange={todayRange}
            onScrollTopRequest={props.onScrollTopRequest}
            forPrint={props.forPrint}
          />
        )}
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


  buildNowIndicatorSegs(date: DateMarker) {
    let nonResourceSegs = this.slicers[''].sliceNowDate(date, this.context.calendar, this.dayRanges)
    return this.joiner.expandSegs(this.props.resourceDayTableModel, nonResourceSegs)
  }


  queryHit(positionLeft: number, positionTop: number): Hit {
    let rawHit = this.timeColsRef.current.positionToHit(positionLeft, positionTop)

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
