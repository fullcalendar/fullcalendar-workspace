import {
  Duration, EventStore, EventUiHash, DateSpan, EventInteractionState,
  BaseComponent, createElement, memoize, Fragment, RefMap, mapHash, createRef,
  getSegMeta, DateMarker, DateRange, DateProfile, sortEventSegs,
} from '@fullcalendar/common'
import { TimelineDateProfile } from './timeline-date-profile'
import { TimelineCoords } from './TimelineCoords'
import { TimelineLaneBg } from './TimelineLaneBg'
import { TimelineLaneSlicer, TimelineLaneSeg } from './TimelineLaneSlicer'
import { TimelineEvent } from './TimelineEvent'
import { computeFgSegPlacements, TimelineSegPlacement } from './event-placement'

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
}

interface TimelineLaneState {
  eventInstanceHeights: { [instanceId: string]: number } // integers
}

export class TimelineLane extends BaseComponent<TimelineLaneProps, TimelineLaneState> {
  private slicer = new TimelineLaneSlicer()
  private sortEventSegs = memoize(sortEventSegs)
  private computeFgSegPlacements = memoize(computeFgSegPlacements)
  private harnessElRefs = new RefMap<HTMLDivElement>()
  private innerElRef = createRef<HTMLDivElement>()

  state: TimelineLaneState = {
    eventInstanceHeights: {},
  }

  render() {
    let { props, state, context } = this
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

    let fgSegs = this.sortEventSegs(slicedProps.fgEventSegs, context.options.eventOrder) as TimelineLaneSeg[]
    let [fgPlacements, fgHeight] = this.computeFgSegPlacements(fgSegs, props.timelineCoords, state.eventInstanceHeights)

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
      prevProps.eventStore !== this.props.eventStore ||
      prevProps.timelineCoords !== this.props.timelineCoords
      // won't trigger on a eventInstanceHeights change
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
    isDragging?: boolean,
    isResizing?: boolean,
    isDateSelecting?: boolean,
  ) {
    let { harnessElRefs, props } = this
    let isMirror = isDragging || isResizing || isDateSelecting

    return (
      <Fragment>
        {segPlacements.map((segPlacement) => {
          let { seg } = segPlacement
          let instanceId = seg.eventRange.instance.instanceId
          let isVisible = segPlacement.isVisible && !isForcedInvisible[instanceId]

          return (
            <div
              key={instanceId}
              ref={isMirror ? null : harnessElRefs.createRef(instanceId)}
              className="fc-timeline-event-harness"
              style={{
                left: segPlacement.left,
                right: -segPlacement.right,
                top: segPlacement.top,
                visibility: isVisible ? ('' as any) : 'hidden',
              }}
            >
              <TimelineEvent
                isTimeScale={props.tDateProfile.isTimeScale}
                seg={seg}
                isDragging={isDragging}
                isResizing={isResizing}
                isDateSelecting={isDateSelecting}
                isSelected={instanceId === this.props.eventSelection /* TODO: bad for mirror? */}
                {...getSegMeta(seg, props.todayRange, props.nowDate)}
              />
            </div>
          )
        })}
      </Fragment>
    )
  }
}

function buildMirrorPlacements(
  mirrorSegs: TimelineLaneSeg[],
  timelineCoords: TimelineCoords | null,
  fgPlacements: TimelineSegPlacement[],
): TimelineSegPlacement[] {
  if (!mirrorSegs.length || !timelineCoords) {
    return []
  }
  let topsByInstanceId = buildAbsoluteTopHash(fgPlacements) // TODO: cache this at first render?
  return mirrorSegs.map((seg) => {
    let horizontalCoords = timelineCoords.rangeToCoords(seg)
    return {
      seg,
      isVisible: true,
      left: horizontalCoords.left,
      right: horizontalCoords.right,
      top: topsByInstanceId[seg.eventRange.instance.instanceId],
    }
  })
}

function buildAbsoluteTopHash(placements: TimelineSegPlacement[]) {
  let topsByInstanceId: { [instanceId: string]: number } = {}

  for (let placement of placements) {
    topsByInstanceId[placement.seg.eventRange.instance.instanceId] = placement.top
  }

  return topsByInstanceId
}
