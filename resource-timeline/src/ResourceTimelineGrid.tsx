import {
  h, ComponentContext, PositionCache,
  Duration, EventStore, DateSpan, EventUiHash, EventInteractionState, DateComponent, Hit, createRef, CssDimValue, VNode, memoize, NowTimer, greatestDurationDenominator, DateMarker, DateRange, NowIndicatorRoot
} from '@fullcalendar/core'
import { ResourceHash, GroupNode, ResourceNode, ResourceSplitter } from '@fullcalendar/resource-common'
import { TimelineDateProfile, TimelineCoords, TimelineSlats, TimelineLaneSlicer, TimelineLaneBg, TimelineLaneSeg } from '@fullcalendar/timeline'
import { ResourceTimelineLanes } from './ResourceTimelineLanes'


export interface ResourceTimelineGridProps {
  tDateProfile: TimelineDateProfile
  rowNodes: (GroupNode | ResourceNode)[]
  businessHours: EventStore | null
  dateSelection: DateSpan | null
  eventStore: EventStore
  eventUiBases: EventUiHash
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  resourceStore: ResourceHash
  nextDayThreshold: Duration
  clientWidth: number | null
  clientHeight: number | null
  tableMinWidth: CssDimValue
  tableColGroupNode: VNode
  expandRows: boolean
  rowInnerHeights: number[]
  onSlatCoords?: (slatCoords: TimelineCoords) => void
  onRowCoords?: (rowCoords: PositionCache) => void
  onScrollLeftRequest?: (scrollLeft: number) => void
  onRowHeightChange?: (rowEl: HTMLTableRowElement, isStable: boolean) => void
}

interface ResourceTimelineGridState {
  slatCoords: TimelineCoords
}


export class ResourceTimelineGrid extends DateComponent<ResourceTimelineGridProps, ResourceTimelineGridState> {

  private computeHasResourceBusinessHours = memoize(computeHasResourceBusinessHours)
  private resourceSplitter = new ResourceSplitter() // doesn't let it do businessHours tho
  private bgSlicer = new TimelineLaneSlicer()
  private slatsRef = createRef<TimelineSlats>() // needed for Hit creation :(
  private rowCoords: PositionCache // for queryHit


  render(props: ResourceTimelineGridProps, state: ResourceTimelineGridState, context: ComponentContext) {
    let { tDateProfile } = props
    let timerUnit = greatestDurationDenominator(tDateProfile.slotDuration).unit
    let hasResourceBusinessHours = this.computeHasResourceBusinessHours(props.rowNodes)

    let splitProps = this.resourceSplitter.splitProps(props)
    let bgLaneProps = splitProps['']
    let bgSlicedProps = this.bgSlicer.sliceProps(
      bgLaneProps,
      context.dateProfile,
      tDateProfile.isTimeScale ? null : props.nextDayThreshold,
      context.calendar,
      context.dateProfile,
      context.dateProfileGenerator,
      tDateProfile,
      context.dateEnv
    )

    return (
      <div ref={this.handleEl} class='fc-timeline-body' style={{
        minWidth: props.tableMinWidth
      }}>
        <NowTimer unit={timerUnit} content={(nowDate: DateMarker, todayRange: DateRange) => [
          <TimelineSlats
            ref={this.slatsRef}
            tDateProfile={tDateProfile}
            nowDate={nowDate}
            todayRange={todayRange}
            clientWidth={props.clientWidth}
            tableColGroupNode={props.tableColGroupNode}
            tableMinWidth={props.tableMinWidth}
            onCoords={this.handleSlatCoords}
            onScrollLeftRequest={props.onScrollLeftRequest}
          />,
          <TimelineLaneBg
            businessHourSegs={hasResourceBusinessHours ? null : bgSlicedProps.businessHourSegs}
            bgEventSegs={bgSlicedProps.bgEventSegs}
            timelineCoords={state.slatCoords}
            eventResizeSegs={(bgSlicedProps.eventResize ? bgSlicedProps.eventResize.segs as TimelineLaneSeg[] : []) /* empty array will result in unnecessary rerenders? */}
            dateSelectionSegs={bgSlicedProps.dateSelectionSegs}
            nowDate={nowDate}
            todayRange={todayRange}
          />,
          <ResourceTimelineLanes
            rowNodes={props.rowNodes}
            tDateProfile={props.tDateProfile}
            nowDate={nowDate}
            todayRange={todayRange}
            splitProps={splitProps}
            fallbackBusinessHours={hasResourceBusinessHours ? props.businessHours : null}
            clientWidth={props.clientWidth}
            minHeight={props.expandRows ? props.clientHeight : ''}
            tableMinWidth={props.tableMinWidth}
            innerHeights={props.rowInnerHeights}
            slatCoords={state.slatCoords}
            onRowCoords={this.handleRowCoords}
            onRowHeightChange={props.onRowHeightChange}
          />,
          (context.options.nowIndicator && state.slatCoords && state.slatCoords.isDateInRange(nowDate)) &&
            <NowIndicatorRoot isAxis={false} date={nowDate}>
              {(rootElRef, classNames, innerElRef, innerContent) => (
                <div
                  ref={rootElRef}
                  class={[ 'fc-timeline-now-indicator-line' ].concat(classNames).join(' ')}
                  style={{ left: state.slatCoords.dateToCoord(nowDate) }}
                >{innerContent}</div>
              )}
            </NowIndicatorRoot>
        ]} />
      </div>
    )
  }


  handleEl = (el: HTMLElement | null) => {
    if (el) {
      this.context.calendar.registerInteractiveComponent(this, { el })
    } else {
      this.context.calendar.unregisterInteractiveComponent(this)
    }
  }


  handleSlatCoords = (slatCoords: TimelineCoords | null) => {
    this.setState({ slatCoords })

    if (this.props.onSlatCoords) {
      this.props.onSlatCoords(slatCoords)
    }
  }


  handleRowCoords = (rowCoords: PositionCache | null) => {
    this.rowCoords = rowCoords

    if (this.props.onRowCoords) {
      this.props.onRowCoords(rowCoords)
    }
  }


  // Hit System
  // ------------------------------------------------------------------------------------------


  queryHit(positionLeft: number, positionTop: number): Hit {
    let rowCoords = this.rowCoords
    let rowIndex = rowCoords.topToIndex(positionTop)

    if (rowIndex != null) {
      let resource = (this.props.rowNodes[rowIndex] as ResourceNode).resource

      if (resource) { // not a group
        let slatHit = this.slatsRef.current.positionToHit(positionLeft)

        if (slatHit) {
          return {
            component: this,
            dateSpan: {
              range: slatHit.dateSpan.range,
              allDay: slatHit.dateSpan.allDay,
              resourceId: resource.id
            },
            rect: {
              left: slatHit.left,
              right: slatHit.right,
              top: rowCoords.tops[rowIndex],
              bottom: rowCoords.bottoms[rowIndex]
            },
            dayEl: slatHit.dayEl,
            layer: 0
          }
        }
      }
    }
  }

}


function computeHasResourceBusinessHours(rowNodes: (GroupNode | ResourceNode)[]) {

  for (let node of rowNodes) {
    let resource = (node as ResourceNode).resource

    if (resource && resource.businessHours) {
      return true
    }
  }

  return false
}
