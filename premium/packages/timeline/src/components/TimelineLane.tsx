import { Duration } from '@fullcalendar/core'
import {
  EventStore, EventUiHash, DateSpan, EventInteractionState,
  BaseComponent, memoize,
  getEventRangeMeta, DateMarker, DateRange, DateProfile, sortEventSegs,
  RefMap,
  afterSize,
  SegGroup,
  EventRangeProps,
  CoordSpan,
  joinClassNames,
} from '@fullcalendar/core/internal'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { TimelineDateProfile } from '../timeline-date-profile.js'
import { horizontalsToCss } from '../TimelineCoords.js'
import { TimelineLaneBg } from './TimelineLaneBg.js'
import { TimelineCoordRange, TimelineLaneSlicer, TimelineRange } from '../TimelineLaneSlicer.js'
import { TimelineEvent } from './TimelineEvent.js'
import { TimelineLaneMoreLink } from './TimelineLaneMoreLink.js'
import { computeFgSegPlacements, computeManySegHorizontals } from '../event-placement.js'
import { TimelineEventHarness } from './TimelineEventHarness.js'

export interface TimelineLaneProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  nextDayThreshold: Duration

  // content
  eventStore: EventStore | null
  eventUiBases: EventUiHash
  businessHours: EventStore | null
  dateSelection: DateSpan | null
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  eventSelection: string
  resourceId?: string // hack

  // dimensions
  slotWidth: number | undefined
}

interface TimelineLaneState {
  segHeightRev?: string
  moreLinkHeightRev?: string
}

/*
TODO: split TimelineLaneBg and TimelineLaneFg?
*/
export class TimelineLane extends BaseComponent<TimelineLaneProps, TimelineLaneState> {
  // memo
  private sortEventSegs = memoize(sortEventSegs)

  // refs
  private segHeightRefMap = new RefMap<string, number>(() => { // keyed by instanceId
    afterSize(this.handleSegHeights)
  })
  private moreLinkHeightRefMap = new RefMap<string, number>(() => { // keyed by SegGroup.key
    afterSize(this.handleMoreLinkHeights)
  })

  // internal
  private slicer = new TimelineLaneSlicer()

  /*
  TODO: lots of memoization needed here!
  */
  render() {
    let { props, context, segHeightRefMap, moreLinkHeightRefMap } = this
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
      (slicedProps.eventDrag ? slicedProps.eventDrag.segs : null) ||
      (slicedProps.eventResize ? slicedProps.eventResize.segs : null) ||
      []

    let fgSegs = this.sortEventSegs(slicedProps.fgEventSegs, options.eventOrder)

    let fgSegHorizontals = props.slotWidth != null
      ? computeManySegHorizontals(fgSegs, options.eventMinWidth, context.dateEnv, tDateProfile, props.slotWidth)
      : {}

    let [fgSegTops, hiddenGroups, hiddenGroupTops, totalHeight] = computeFgSegPlacements(
      fgSegs,
      fgSegHorizontals,
      segHeightRefMap.current,
      moreLinkHeightRefMap.current,
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
          tDateProfile={tDateProfile}
          nowDate={props.nowDate}
          todayRange={props.todayRange}

          // content
          bgEventSegs={slicedProps.bgEventSegs}
          businessHourSegs={slicedProps.businessHourSegs}
          dateSelectionSegs={slicedProps.dateSelectionSegs}
          eventResizeSegs={slicedProps.eventResize ? slicedProps.eventResize.segs : [] /* bad new empty array? */}

          // dimensions
          slotWidth={props.slotWidth}
        />
        <div
          className={joinClassNames(
            'fc-timeline-events',
            options.eventOverlap === false // TODO: fix bad default
              ? 'fc-timeline-events-overlap-disabled'
              : 'fc-timeline-events-overlap-enabled',
            'fc-content-box', // because height is set, and padding might be set
          )}
          style={{ height: totalHeight }}
        >
          {this.renderFgSegs(
            fgSegs,
            fgSegHorizontals,
            fgSegTops,
            forcedInvisibleMap,
            hiddenGroups,
            hiddenGroupTops,
            false, // isDragging
            false, // isResizing
            false, // isDateSelecting
          )}
          {this.renderFgSegs(
            mirrorSegs,
            props.slotWidth // TODO: memoize
              ? computeManySegHorizontals(mirrorSegs, options.eventMinWidth, context.dateEnv, tDateProfile, props.slotWidth)
              : {},
            fgSegTops,
            {}, // forcedInvisibleMap
            [], // hiddenGroups
            new Map(), // hiddenGroupTops
            Boolean(slicedProps.eventDrag),
            Boolean(slicedProps.eventResize),
            false, // isDateSelecting. because mirror is never drawn for date selection
          )}
        </div>
      </Fragment>
    )
  }

  renderFgSegs(
    segs: (TimelineRange & EventRangeProps)[],
    segHorizontals: { [instanceId: string]: CoordSpan },
    segTops: Map<string, number>,
    forcedInvisibleMap: { [instanceId: string]: any },
    hiddenGroups: SegGroup<TimelineCoordRange>[],
    hiddenGroupTops: Map<string, number>,
    isDragging: boolean,
    isResizing: boolean,
    isDateSelecting: boolean,
  ) {
    let { props, context, segHeightRefMap, moreLinkHeightRefMap } = this
    let isMirror = isDragging || isResizing || isDateSelecting

    return (
      <Fragment>
        {segs.map((seg) => {
          const { eventRange } = seg
          const { instanceId } = eventRange.instance
          const segTop = segTops.get(instanceId)
          const segHorizontal = segHorizontals[instanceId]
          const isVisible = isMirror ||
            (segHorizontal && segTop != null && !forcedInvisibleMap[instanceId])

          return (
            <TimelineEventHarness
              key={instanceId}
              style={{
                visibility: isVisible ? '' : 'hidden',
                top: segTop || 0,
                ...horizontalsToCss(segHorizontal, context.isRtl),
              }}
              heightRef={isMirror ? undefined : segHeightRefMap.createRef(instanceId)}
            >
              <TimelineEvent
                isTimeScale={props.tDateProfile.isTimeScale}
                eventRange={eventRange}
                isStart={seg.isStart}
                isEnd={seg.isEnd}
                isDragging={isDragging}
                isResizing={isResizing}
                isDateSelecting={isDateSelecting}
                isSelected={instanceId === props.eventSelection /* TODO: bad for mirror? */}
                {...getEventRangeMeta(eventRange, props.todayRange, props.nowDate)}
              />
            </TimelineEventHarness>
          )
        })}
        {/* TODO: need different Fragment parents for separate array keys? */}
        {hiddenGroups.map((hiddenGroup) => (
          <TimelineEventHarness
            key={hiddenGroup.key}
            style={{
              top: hiddenGroupTops.get(hiddenGroup.key) || 0,
              ...horizontalsToCss({ // TODO: better way to do this?
                start: hiddenGroup.start,
                size: hiddenGroup.end - hiddenGroup.start
              }, context.isRtl),
            }}
            heightRef={moreLinkHeightRefMap.createRef(hiddenGroup.key)}
          >
            <TimelineLaneMoreLink
              hiddenSegs={hiddenGroup.segs}
              dateProfile={props.dateProfile}
              nowDate={props.nowDate}
              todayRange={props.todayRange}
              isTimeScale={props.tDateProfile.isTimeScale}
              eventSelection={props.eventSelection}
              resourceId={props.resourceId}
              forcedInvisibleMap={forcedInvisibleMap}
            />
          </TimelineEventHarness>
        ))}
      </Fragment>
    )
  }

  private handleMoreLinkHeights = () => {
    this.setState({ moreLinkHeightRev: this.moreLinkHeightRefMap.rev }) // will trigger rerender
  }

  private handleSegHeights = () => {
    this.setState({ segHeightRev: this.segHeightRefMap.rev }) // will trigger rerender
  }
}
