import {
  createElement, PositionCache, Duration, EventStore, DateSpan, EventUiHash, EventInteractionState,
  DateComponent, Hit, createRef, CssDimValue, VNode, memoize, NowTimer, greatestDurationDenominator,
  DateMarker, DateRange, NowIndicatorRoot, DateProfile, Fragment,
} from '@fullcalendar/common'
import { ResourceHash, GroupNode, ResourceNode, ResourceSplitter } from '@fullcalendar/resource-common'
import {
  TimelineDateProfile, TimelineCoords, TimelineSlats,
  TimelineLaneSlicer, TimelineLaneBg, TimelineLaneSeg,
  coordToCss,
} from '@fullcalendar/timeline'
import { ResourceTimelineLanes } from './ResourceTimelineLanes'

export interface ResourceTimelineGridProps {
  dateProfile: DateProfile
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
  slatCoords: TimelineCoords | null
}

export class ResourceTimelineGrid extends DateComponent<ResourceTimelineGridProps, ResourceTimelineGridState> {
  private computeHasResourceBusinessHours = memoize(computeHasResourceBusinessHours)
  private resourceSplitter = new ResourceSplitter() // doesn't let it do businessHours tho
  private bgSlicer = new TimelineLaneSlicer()
  private slatsRef = createRef<TimelineSlats>() // needed for Hit creation :(
  private rowCoords: PositionCache // for queryHit

  state: ResourceTimelineGridState = {
    slatCoords: null,
  }

  render() {
    let { props, state, context } = this
    let { dateProfile, tDateProfile } = props
    let timerUnit = greatestDurationDenominator(tDateProfile.slotDuration).unit
    let hasResourceBusinessHours = this.computeHasResourceBusinessHours(props.rowNodes)

    let splitProps = this.resourceSplitter.splitProps(props)
    let bgLaneProps = splitProps['']
    let bgSlicedProps = this.bgSlicer.sliceProps(
      bgLaneProps,
      dateProfile,
      tDateProfile.isTimeScale ? null : props.nextDayThreshold,
      context, // wish we didn't need to pass in the rest of these args...
      dateProfile,
      context.dateProfileGenerator,
      tDateProfile,
      context.dateEnv,
    )

    // WORKAROUND: make ignore slatCoords when out of sync with dateProfile
    let slatCoords = state.slatCoords && state.slatCoords.dateProfile === props.dateProfile ? state.slatCoords : null

    return (
      <div
        ref={this.handleEl}
        className={[
          'fc-timeline-body',
          props.expandRows ? 'fc-timeline-body-expandrows' : '',
        ].join(' ')}
        style={{ minWidth: props.tableMinWidth }}
      >
        <NowTimer unit={timerUnit}>
          {(nowDate: DateMarker, todayRange: DateRange) => (
            <Fragment>
              <TimelineSlats
                ref={this.slatsRef}
                dateProfile={dateProfile}
                tDateProfile={tDateProfile}
                nowDate={nowDate}
                todayRange={todayRange}
                clientWidth={props.clientWidth}
                tableColGroupNode={props.tableColGroupNode}
                tableMinWidth={props.tableMinWidth}
                onCoords={this.handleSlatCoords}
                onScrollLeftRequest={props.onScrollLeftRequest}
              />
              <TimelineLaneBg
                businessHourSegs={hasResourceBusinessHours ? null : bgSlicedProps.businessHourSegs}
                bgEventSegs={bgSlicedProps.bgEventSegs}
                timelineCoords={slatCoords}
                // empty array will result in unnecessary rerenders?
                eventResizeSegs={(bgSlicedProps.eventResize ? bgSlicedProps.eventResize.segs as TimelineLaneSeg[] : [])}
                dateSelectionSegs={bgSlicedProps.dateSelectionSegs}
                nowDate={nowDate}
                todayRange={todayRange}
              />
              <ResourceTimelineLanes
                rowNodes={props.rowNodes}
                dateProfile={dateProfile}
                tDateProfile={props.tDateProfile}
                nowDate={nowDate}
                todayRange={todayRange}
                splitProps={splitProps}
                fallbackBusinessHours={hasResourceBusinessHours ? props.businessHours : null}
                clientWidth={props.clientWidth}
                minHeight={props.expandRows ? props.clientHeight : ''}
                tableMinWidth={props.tableMinWidth}
                innerHeights={props.rowInnerHeights}
                slatCoords={slatCoords}
                onRowCoords={this.handleRowCoords}
                onRowHeightChange={props.onRowHeightChange}
              />
              {(context.options.nowIndicator && slatCoords && slatCoords.isDateInRange(nowDate)) && (
                <div className="fc-timeline-now-indicator-container">
                  <NowIndicatorRoot isAxis={false} date={nowDate}>
                    {(rootElRef, classNames, innerElRef, innerContent) => (
                      <div
                        ref={rootElRef}
                        className={['fc-timeline-now-indicator-line'].concat(classNames).join(' ')}
                        style={coordToCss(slatCoords.dateToCoord(nowDate), context.isRtl)}
                      >
                        {innerContent}
                      </div>
                    )}
                  </NowIndicatorRoot>
                </div>
              )}
            </Fragment>
          )}
        </NowTimer>
      </div>
    )
  }

  handleEl = (el: HTMLElement | null) => {
    if (el) {
      this.context.registerInteractiveComponent(this, { el })
    } else {
      this.context.unregisterInteractiveComponent(this)
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
            dateProfile: this.props.dateProfile,
            dateSpan: {
              range: slatHit.dateSpan.range,
              allDay: slatHit.dateSpan.allDay,
              resourceId: resource.id,
            },
            rect: {
              left: slatHit.left,
              right: slatHit.right,
              top: rowCoords.tops[rowIndex],
              bottom: rowCoords.bottoms[rowIndex],
            },
            dayEl: slatHit.dayEl,
            layer: 0,
          }
        }
      }
    }

    return null
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
