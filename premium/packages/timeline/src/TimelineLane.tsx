import {
  Duration, EventStore, EventUiHash, DateSpan, EventInteractionState,
  BaseComponent, createElement, memoize, Fragment, RefMap, mapHash, createRef,
  getSegMeta, DateMarker, DateRange, DateProfile, sortEventSegs, isPropsEqual, buildIsoString,
  computeEarliestSegStart,
} from '@fullcalendar/common'
import { TimelineDateProfile } from './timeline-date-profile'
import { coordsToCss, TimelineCoords } from './TimelineCoords'
import { TimelineLaneBg } from './TimelineLaneBg'
import { TimelineLaneSlicer, TimelineLaneSeg } from './TimelineLaneSlicer'
import { TimelineEvent } from './TimelineEvent'
import { TimelineLaneMoreLink } from './TimelineLaneMoreLink'
import { computeFgSegPlacements, computeSegHCoords, TimelineSegPlacement } from './event-placement'

export interface TimelineLaneProps extends TimelineLaneCoreProps {
  onHeightChange?: (innerEl: HTMLElement, isStable: boolean) => void
}

export interface TimelineLaneCoreProps {
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
}

interface TimelineLaneState {
  eventInstanceHeights: { [instanceId: string]: number } // integers
  moreLinkHeights: { [isoStr: string]: number } // integers
}

export class TimelineLane extends BaseComponent<TimelineLaneProps, TimelineLaneState> {
  private slicer = new TimelineLaneSlicer()
  private sortEventSegs = memoize(sortEventSegs)
  private harnessElRefs = new RefMap<HTMLDivElement>()
  private moreElRefs = new RefMap<HTMLDivElement>()
  private innerElRef = createRef<HTMLDivElement>()
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

    let isForcedInvisible = // TODO: more convenient
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
          ref={this.innerElRef}
          style={{ height: fgHeight }}
        >
          {this.renderFgSegs(
            fgPlacements,
            isForcedInvisible,
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
    this.updateSize()
  }

  componentDidUpdate(prevProps: TimelineLaneProps, prevState: TimelineLaneState) {
    if (
      prevProps.eventStore !== this.props.eventStore || // external thing changed?
      prevProps.timelineCoords !== this.props.timelineCoords || // external thing changed?
      prevState.moreLinkHeights !== this.state.moreLinkHeights // HACK. see addStateEquality
    ) {
      this.updateSize()
    }
  }

  updateSize() {
    let { props } = this
    let { timelineCoords } = props

    if (props.onHeightChange) {
      props.onHeightChange(this.innerElRef.current, false)
    }

    if (timelineCoords) {
      this.setState({
        eventInstanceHeights: mapHash(this.harnessElRefs.currentMap, (harnessEl) => (
          Math.round(harnessEl.getBoundingClientRect().height)
        )),
        moreLinkHeights: mapHash(this.moreElRefs.currentMap, (moreEl) => (
          Math.round(moreEl.getBoundingClientRect().height)
        )),
      }, () => {
        if (props.onHeightChange) {
          props.onHeightChange(this.innerElRef.current, true)
        }
      })
    }
  }

  renderFgSegs(
    segPlacements: TimelineSegPlacement[],
    isForcedInvisible: { [instanceId: string]: any },
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
                isForcedInvisible={isForcedInvisible}
              />
            )
          }

          let instanceId = seg.eventRange.instance.instanceId
          let isVisible = isMirror || Boolean(!isForcedInvisible[instanceId] && hcoords && top !== null)
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
