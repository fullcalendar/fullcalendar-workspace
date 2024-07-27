import { Duration } from '@fullcalendar/core'
import {
  EventStore, EventUiHash, DateSpan, EventInteractionState,
  BaseComponent, memoize,
  getSegMeta, DateMarker, DateRange, DateProfile, sortEventSegs, isPropsEqual, buildIsoString,
  computeEarliestSegStart,
  RefMap,
} from '@fullcalendar/core/internal'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { TimelineDateProfile } from '../timeline-date-profile.js'
import { coordsToCss, TimelineCoords } from '../TimelineCoords.js'
import { TimelineLaneBg } from './TimelineLaneBg.js'
import { TimelineLaneSlicer, TimelineLaneSeg } from '../TimelineLaneSlicer.js'
import { TimelineEvent } from './TimelineEvent.js'
import { TimelineLaneMoreLink } from './TimelineLaneMoreLink.js'
import { computeFgSegPlacements, computeSegHCoords, TimelineSegPlacement } from '../event-placement.js'

export interface TimelineLaneProps {
  nowDate: DateMarker
  todayRange: DateRange
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nextDayThreshold: Duration
  businessHours: EventStore | null
  eventStore: EventStore | null
  eventUiBases: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  timelineCoords: TimelineCoords | null // TODO: renamt to SLAT coords?
  resourceId?: string // hack
  onHeightStable?: (isStable: boolean) => void
}

interface TimelineLaneState {
  eventInstanceHeights: { [instanceId: string]: number } // integers
  moreLinkHeights: { [isoStr: string]: number } // integers
}

export class TimelineLane extends BaseComponent<TimelineLaneProps, TimelineLaneState> {
  private slicer = new TimelineLaneSlicer()
  private sortEventSegs = memoize(sortEventSegs)
  private harnessElRefs = new RefMap<string, HTMLDivElement>() // keyed by instanceId
  private moreElRefs = new RefMap<string, HTMLDivElement>() // keyed by isoStr
  // TODO: memoize event positioning

  state: TimelineLaneState = {
    eventInstanceHeights: {},
    moreLinkHeights: {},
  }

  render() {
    let { props, state, context } = this
    let { options } = context
    let { dateProfile, tDateProfile } = props

    let slicedProps = this.slicer.sliceProps(
      props,
      dateProfile,
      tDateProfile.isTimeScale ? null : props.nextDayThreshold,
      context, // wish we didn't have to pass in the rest of the args...
      dateProfile,
      context.dateProfileGenerator,
      tDateProfile,
      context.dateEnv,
    )

    let mirrorSegs =
      (slicedProps.eventDrag ? slicedProps.eventDrag.segs as TimelineLaneSeg[] : null) ||
      (slicedProps.eventResize ? slicedProps.eventResize.segs as TimelineLaneSeg[] : null) ||
      []

    let fgSegs = this.sortEventSegs(slicedProps.fgEventSegs, options.eventOrder) as TimelineLaneSeg[]
    let fgSegHCoords = computeSegHCoords(fgSegs, options.eventMinWidth, props.timelineCoords)
    let [fgPlacements, fgHeight] = computeFgSegPlacements(
      fgSegs,
      fgSegHCoords,
      state.eventInstanceHeights,
      state.moreLinkHeights,
      options.eventOrderStrict,
      options.eventMaxStack,
    )

    let forcedInvisibleMap = // TODO: more convenient/DRY
      (slicedProps.eventDrag ? slicedProps.eventDrag.affectedInstances : null) ||
      (slicedProps.eventResize ? slicedProps.eventResize.affectedInstances : null) ||
      {}

    return (
      <Fragment>
        <TimelineLaneBg
          businessHourSegs={slicedProps.businessHourSegs}
          bgEventSegs={slicedProps.bgEventSegs}
          timelineCoords={props.timelineCoords}
          eventResizeSegs={slicedProps.eventResize ? slicedProps.eventResize.segs as TimelineLaneSeg[] : [] /* bad new empty array? */}
          dateSelectionSegs={slicedProps.dateSelectionSegs}
          nowDate={props.nowDate}
          todayRange={props.todayRange}
        />
        <div
          className="fc-timeline-events fc-scrollgrid-sync-inner"
          style={{ height: fgHeight }}
        >
          {this.renderFgSegs(
            fgPlacements,
            forcedInvisibleMap,
            false,
            false,
            false,
          )}
          {this.renderFgSegs(
            buildMirrorPlacements(mirrorSegs, props.timelineCoords, fgPlacements),
            {},
            Boolean(slicedProps.eventDrag),
            Boolean(slicedProps.eventResize),
            false, // because mirror is never drawn for date selection
          )}
        </div>
      </Fragment>
    )
  }

  componentDidMount() {
    this.handleSizing()
    this.context.addResizeHandler(this.handleSizing)
  }

  componentDidUpdate(prevProps: TimelineLaneProps, prevState: TimelineLaneState) {
    if (
      prevProps.eventStore !== this.props.eventStore || // external thing changed?
      prevProps.timelineCoords !== this.props.timelineCoords || // external thing changed?
      prevState.moreLinkHeights !== this.state.moreLinkHeights // HACK. see addStateEquality
    ) {
      this.handleSizing()
    }
  }

  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)
  }

  handleSizing = () => {
    let { props } = this
    let { timelineCoords, onHeightStable } = props

    if (onHeightStable) {
      onHeightStable(false)
    }

    if (timelineCoords) {
      const eventInstanceHeights: { [instanceId: string]: number } = {}
      for (const [instanceId, harnessEl] of this.harnessElRefs.current.entries()) {
        eventInstanceHeights[instanceId] = harnessEl.getBoundingClientRect().height
      }

      const moreLinkHeights: { [isoStr: string]: number } = {}
      for (const [isoStr, moreEl] of this.moreElRefs.current.entries()) {
        moreLinkHeights[isoStr] = moreEl.getBoundingClientRect().height
      }

      this.setState({
        eventInstanceHeights,
        moreLinkHeights,
      }, () => {
        if (onHeightStable) {
          onHeightStable(true)
        }
      })
    }
  }

  renderFgSegs(
    segPlacements: TimelineSegPlacement[],
    forcedInvisibleMap: { [instanceId: string]: any },
    isDragging: boolean,
    isResizing: boolean,
    isDateSelecting: boolean,
  ) {
    let { harnessElRefs, moreElRefs, props, context } = this
    let isMirror = isDragging || isResizing || isDateSelecting

    return (
      <Fragment>
        {segPlacements.map((segPlacement) => {
          let { seg, hcoords, top } = segPlacement

          if (Array.isArray(seg)) { // a more-link
            let isoStr = buildIsoString(computeEarliestSegStart(seg))
            return (
              <TimelineLaneMoreLink
                key={'m:' + isoStr /* "m" for "more" */}
                elRef={moreElRefs.createRef(isoStr)}
                hiddenSegs={seg}
                placement={segPlacement}
                dateProfile={props.dateProfile}
                nowDate={props.nowDate}
                todayRange={props.todayRange}
                isTimeScale={props.tDateProfile.isTimeScale}
                eventSelection={props.eventSelection}
                resourceId={props.resourceId}
                forcedInvisibleMap={forcedInvisibleMap}
              />
            )
          }

          let instanceId = seg.eventRange.instance.instanceId
          let isVisible = isMirror || Boolean(!forcedInvisibleMap[instanceId] && hcoords && top !== null)
          let hStyle = coordsToCss(hcoords, context.isRtl)

          return (
            <div
              key={'e:' + instanceId /* "e" for "event" */}
              ref={isMirror ? null : harnessElRefs.createRef(instanceId)}
              className="fc-timeline-event-harness"
              style={{
                visibility: isVisible ? ('' as any) : 'hidden',
                top: top || 0,
                ...hStyle,
              }}
            >
              <TimelineEvent
                isTimeScale={props.tDateProfile.isTimeScale}
                seg={seg}
                isDragging={isDragging}
                isResizing={isResizing}
                isDateSelecting={isDateSelecting}
                isSelected={instanceId === props.eventSelection /* TODO: bad for mirror? */}
                {...getSegMeta(seg, props.todayRange, props.nowDate)}
              />
            </div>
          )
        })}
      </Fragment>
    )
  }
}

TimelineLane.addStateEquality({
  eventInstanceHeights: isPropsEqual,
  moreLinkHeights: isPropsEqual,
})

function buildMirrorPlacements(
  mirrorSegs: TimelineLaneSeg[],
  timelineCoords: TimelineCoords | null,
  fgPlacements: TimelineSegPlacement[],
): TimelineSegPlacement[] {
  if (!mirrorSegs.length || !timelineCoords) {
    return []
  }
  let topsByInstanceId = buildAbsoluteTopHash(fgPlacements) // TODO: cache this at first render?
  return mirrorSegs.map((seg) => ({
    seg,
    hcoords: timelineCoords.rangeToCoords(seg),
    top: topsByInstanceId[seg.eventRange.instance.instanceId],
  }))
}

function buildAbsoluteTopHash(placements: TimelineSegPlacement[]) {
  let topsByInstanceId: { [instanceId: string]: number } = {}

  for (let placement of placements) {
    let { seg } = placement
    if (!Array.isArray(seg)) { // doesn't represent a more-link
      topsByInstanceId[seg.eventRange.instance.instanceId] = placement.top
    }
  }

  return topsByInstanceId
}
