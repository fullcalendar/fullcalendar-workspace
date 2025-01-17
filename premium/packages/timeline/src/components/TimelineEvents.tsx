import {
  BaseComponent, memoize,
  getEventRangeMeta, DateMarker, DateRange, DateProfile, sortEventSegs,
  RefMap,
  afterSize,
  SegGroup,
  EventRangeProps,
  CoordSpan,
  setRef,
  EventSegUiInteractionState,
} from '@fullcalendar/core/internal'
import { createElement, Fragment, Ref } from '@fullcalendar/core/preact'
import { TimelineDateProfile } from '../timeline-date-profile.js'
import { horizontalsToCss } from '../TimelineCoords.js'
import { TimelineCoordRange, TimelineRange } from '../TimelineLaneSlicer.js'
import { TimelineEvent } from './TimelineEvent.js'
import { TimelineLaneMoreLink } from './TimelineLaneMoreLink.js'
import { computeFgSegPlacements, computeManySegHorizontals } from '../event-placement.js'
import { TimelineEventHarness } from './TimelineEventHarness.js'

export interface TimelineEventsProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange

  // content
  fgEventSegs: (TimelineRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<TimelineRange> | null
  eventResize: EventSegUiInteractionState<TimelineRange> | null
  eventSelection: string
  resourceId?: string // hack

  // dimensions
  slotWidth: number | undefined

  // ref
  heightRef?: Ref<number>
}

interface TimelineLaneState {
  segHeightRev?: string
  moreLinkHeightRev?: string
}

export class TimelineEvents extends BaseComponent<TimelineEventsProps, TimelineLaneState> {
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
  private totalHeight?: number
  private firedTotalHeight?: number

  /*
  TODO: lots of memoization needed here!
  */
  render() {
    let { props, context, segHeightRefMap, moreLinkHeightRefMap } = this
    let { options } = context
    let { tDateProfile } = props

    let mirrorSegs =
      (props.eventDrag ? props.eventDrag.segs : null) ||
      (props.eventResize ? props.eventResize.segs : null) ||
      []

    let fgSegs = this.sortEventSegs(props.fgEventSegs, options.eventOrder)

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
    this.totalHeight = totalHeight

    let forcedInvisibleMap = // TODO: more convenient/DRY
      (props.eventDrag ? props.eventDrag.affectedInstances : null) ||
      (props.eventResize ? props.eventResize.affectedInstances : null) ||
      {}

    return (
      <div
        // fc-content-box because height is set, and padding might be set
        className='fc-timeline-events fc-content-box fc-rel'
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
          Boolean(props.eventDrag),
          Boolean(props.eventResize),
          false, // isDateSelecting. because mirror is never drawn for date selection
        )}
      </div>
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

  /*
  componentDidMount(): void {
    // might want to do firedTotalHeight, but won't be ready on first render
  }
  */

  componentDidUpdate(): void {
    if (this.totalHeight !== this.firedTotalHeight) {
      this.firedTotalHeight = this.totalHeight
      setRef(this.props.heightRef, this.totalHeight)
    }
  }

  componentWillUnmount(): void {
    setRef(this.props.heightRef, null)
  }
}
