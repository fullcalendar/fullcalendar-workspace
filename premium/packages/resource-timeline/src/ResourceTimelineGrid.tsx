import { Duration, CssDimValue } from '@fullcalendar/core'
import {
  EventStore, DateSpan, EventUiHash, EventInteractionState,
  DateComponent, Hit, memoize, NowTimer, greatestDurationDenominator,
  DateMarker, DateRange, NowIndicatorContainer, DateProfile,
} from '@fullcalendar/core/internal'
import { createElement, createRef, Fragment } from '@fullcalendar/core/preact'
import { ResourceHash, ResourceSplitter, Resource, Group, ParentNode, isEntityGroup } from '@fullcalendar/resource/internal'
import {
  TimelineDateProfile, TimelineCoords, TimelineSlats,
  TimelineLaneSlicer, TimelineLaneBg, TimelineLaneSeg,
  coordToCss,
} from '@fullcalendar/timeline/internal'
import { ResourceTimelineLanes } from './ResourceTimelineLanes.js'
import { GroupRowDisplay, ResourceRowDisplay, searchTopmostEntity } from './resource-table.js'

export interface ResourceTimelineGridProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  groupRowDisplays: GroupRowDisplay[]
  resourceRowDisplays: ResourceRowDisplay[]
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
  expandRows: boolean
  onSlatCoords?: (slatCoords: TimelineCoords) => void
  onScrollLeftRequest?: (scrollLeft: number) => void
  verticalPositions: Map<Resource | Group, { top: number, height: number }>
  heightHierarchy: ParentNode<Resource | Group>[]
}

interface ResourceTimelineGridState {
  slatCoords: TimelineCoords | null
}

export class ResourceTimelineGrid extends DateComponent<ResourceTimelineGridProps, ResourceTimelineGridState> {
  private computeHasResourceBusinessHours = memoize(computeHasResourceBusinessHours)
  private resourceSplitter = new ResourceSplitter() // doesn't let it do businessHours tho
  private bgSlicer = new TimelineLaneSlicer()
  private slatsRef = createRef<TimelineSlats>() // needed for Hit creation :(

  state: ResourceTimelineGridState = {
    slatCoords: null,
  }

  render() {
    let { props, state, context } = this
    let { dateProfile, tDateProfile } = props
    let timerUnit = greatestDurationDenominator(tDateProfile.slotDuration).unit
    let hasResourceBusinessHours = this.computeHasResourceBusinessHours(props.resourceRowDisplays)

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
                groupRowDisplays={props.groupRowDisplays}
                resourceRowDisplays={props.resourceRowDisplays}
                dateProfile={dateProfile}
                tDateProfile={props.tDateProfile}
                nowDate={nowDate}
                todayRange={todayRange}
                splitProps={splitProps}
                fallbackBusinessHours={hasResourceBusinessHours ? props.businessHours : null}
                clientWidth={props.clientWidth}
                minHeight={props.expandRows ? props.clientHeight : ''}
                tableMinWidth={props.tableMinWidth}
                slatCoords={slatCoords}
                verticalPositions={props.verticalPositions}
              />
              {(context.options.nowIndicator && slatCoords && slatCoords.isDateInRange(nowDate)) && (
                <div className="fc-timeline-now-indicator-container">
                  <NowIndicatorContainer
                    elClasses={['fc-timeline-now-indicator-line']}
                    elStyle={coordToCss(slatCoords.dateToCoord(nowDate), context.isRtl)}
                    isAxis={false}
                    date={nowDate}
                  />
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

  // Hit System
  // ------------------------------------------------------------------------------------------

  queryHit(positionLeft: number, positionTop: number): Hit {
    let { dateProfile, heightHierarchy, verticalPositions } = this.props

    let entityAtTop = searchTopmostEntity(
      positionTop,
      heightHierarchy,
      verticalPositions,
    )

    if (entityAtTop && !isEntityGroup(entityAtTop)) {
      let resource = entityAtTop
      let { top, height } = verticalPositions.get(resource)
      let bottom = top + height
      let slatHit = this.slatsRef.current.positionToHit(positionLeft)

      if (slatHit) {
        return {
          dateProfile,
          dateSpan: {
            range: slatHit.dateSpan.range,
            allDay: slatHit.dateSpan.allDay,
            resourceId: resource.id,
          },
          rect: {
            left: slatHit.left,
            right: slatHit.right,
            top,
            bottom,
          },
          dayEl: slatHit.dayEl,
          layer: 0,
        }
      }
    }

    return null
  }
}

function computeHasResourceBusinessHours(resourceRowDisplays: ResourceRowDisplay[]) {
  for (let resourceRowDisplay of resourceRowDisplays) {
    let { resource } = resourceRowDisplay

    if (resource && resource.businessHours) {
      return true
    }
  }

  return false
}
