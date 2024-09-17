import { Duration } from '@fullcalendar/core'
import {
  EventStore, EventUiHash, DateSpan, EventInteractionState,
  BaseComponent, memoize,
  getSegMeta, DateMarker, DateRange, DateProfile, sortEventSegs,
  SegGroup,
  RefMap,
  guid,
  afterSize,
  setRef,
} from '@fullcalendar/core/internal'
import { createElement, Fragment, Ref } from '@fullcalendar/core/preact'
import { TimelineDateProfile } from '../timeline-date-profile.js'
import { horizontalsToCss } from '../TimelineCoords.js'
import { TimelineLaneBg } from './TimelineLaneBg.js'
import { TimelineLaneSlicer, TimelineLaneSeg } from '../TimelineLaneSlicer.js'
import { TimelineEvent } from './TimelineEvent.js'
import { TimelineLaneMoreLink } from './TimelineLaneMoreLink.js'
import { computeFgSegPlacements, computeManySegHorizontals, computeMoreLinkMaxBottom, TimelineSegHorizontals } from '../event-placement.js'
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

  // refs
  innerHeightRef?: Ref<number>
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
  private innerHeight?: number

  // internal
  private slicer = new TimelineLaneSlicer()

  /*
  TODO: lots of memoization needed here!
  */
  render() {
    let { props, context, segHeightRefMap } = this
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

    let fgSegHorizontals = props.slotWidth != null
      ? computeManySegHorizontals(fgSegs, options.eventMinWidth, context.dateEnv, tDateProfile, props.slotWidth)
      : {}

    let [fgSegTops, fgSegsBottom, hiddenGroups, hiddenGroupTops] = computeFgSegPlacements( // verticals
      fgSegs,
      fgSegHorizontals,
      segHeightRefMap.current,
      options.eventOrderStrict,
      options.eventMaxStack,
    )

    let innerHeight: number | undefined
    let moreLinksBottom = computeMoreLinkMaxBottom(hiddenGroups, hiddenGroupTops, this.moreLinkHeightRefMap.current)

    if (fgSegsBottom != null && moreLinksBottom != null) { // ready?
      innerHeight = Math.max(moreLinksBottom, fgSegsBottom)

      if (this.innerHeight !== innerHeight) {
        this.innerHeight = innerHeight
        setRef(props.innerHeightRef, innerHeight)
      }
    }

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
          eventResizeSegs={slicedProps.eventResize ? slicedProps.eventResize.segs as TimelineLaneSeg[] : [] /* bad new empty array? */}

          // dimensions
          slotWidth={props.slotWidth}
        />
        <div
          className="fcnew-timeline-events"
          style={{ height: innerHeight }}
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
            [],
            {},
            Boolean(slicedProps.eventDrag),
            Boolean(slicedProps.eventResize),
            false, // isDateSelecting. because mirror is never drawn for date selection
          )}
        </div>
      </Fragment>
    )
  }

  renderFgSegs(
    segs: TimelineLaneSeg[],
    segHorizontals: { [instanceId: string]: TimelineSegHorizontals },
    segTops: { [instanceId: string]: number },
    forcedInvisibleMap: { [instanceId: string]: any },
    hiddenGroups: SegGroup[],
    hiddenGroupTops: { [key: string]: number },
    isDragging: boolean,
    isResizing: boolean,
    isDateSelecting: boolean,
  ) {
    let { props, context, segHeightRefMap, moreLinkHeightRefMap } = this
    let isMirror = isDragging || isResizing || isDateSelecting

    return (
      <Fragment>
        {segs.map((seg) => {
          const { instanceId } = seg.eventRange.instance
          const segTop = segTops[instanceId]
          const segHorizontal = segHorizontals[instanceId]
          const isVisible = segTop !== null && segHorizontal &&
            (isMirror || Boolean(!forcedInvisibleMap[instanceId]))

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
                seg={seg}
                isDragging={isDragging}
                isResizing={isResizing}
                isDateSelecting={isDateSelecting}
                isSelected={instanceId === props.eventSelection /* TODO: bad for mirror? */}
                {...getSegMeta(seg, props.todayRange, props.nowDate)}
              />
            </TimelineEventHarness>
          )
        })}
        {/* TODO: need different Fragment parents for separate array keys? */}
        {hiddenGroups.map((hiddenGroup) => (
          <TimelineEventHarness
            key={hiddenGroup.key}
            style={{
              top: hiddenGroupTops[hiddenGroup.key] || 0,
              ...horizontalsToCss({ // TODO: better way to do this?
                start: hiddenGroup.span.start,
                size: hiddenGroup.span.end - hiddenGroup.span.start
              }, context.isRtl),
            }}
            heightRef={moreLinkHeightRefMap.createRef(hiddenGroup.key)}
          >
            <TimelineLaneMoreLink
              hiddenSegs={hiddenGroup.segs as TimelineLaneSeg[] /* TODO: make SegGroup generic! */}
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

  componentWillUnmount() {
    if (this.innerHeight != null) {
      this.innerHeight = undefined
      setRef(this.props.innerHeightRef, null)
    }
  }

  private handleMoreLinkHeights = () => {
    this.setState({ moreLinkHeightRev: guid() }) // will trigger rerender
  }

  private handleSegHeights = () => {
    this.setState({ segHeightRev: guid() }) // will trigger rerender
  }
}
