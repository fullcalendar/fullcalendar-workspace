import { joinClassNames } from '@fullcalendar/preact/public-api'
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
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { type Ref } from 'react'
import { TimelineDateProfile } from '../timeline-date-profile'
import { TimelineCoordRange, TimelineRange } from '../TimelineLaneSlicer'
import { TimelineEvent } from './TimelineEvent'
import { TimelineLaneMoreLink } from './TimelineLaneMoreLink'
import { computeFgSegPlacements, computeManySegHorizontals } from '../event-placement'
import { TimelineEventHarness } from './TimelineEventHarness'

export interface TimelineFgProps {
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
  slotWidth: number

  // virtualization (optional)
  clipStart?: number
  clipEnd?: number

  // ref
  heightRef?: Ref<number>
}

interface TimelineFgState {
  segHeightRev?: string
  moreLinkHeightRev?: string
}

export class TimelineFg extends BaseComponent<TimelineFgProps, TimelineFgState> {
  state = {} as TimelineFgState

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
  private _isUnmounting: boolean
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

    let fgSegHorizontals = computeManySegHorizontals(fgSegs, options.eventMinWidth, context.dateEnv, tDateProfile, props.slotWidth, props.clipStart, props.clipEnd)
    let [fgSegTops, hiddenGroups, hiddenGroupTops, totalHeight] = computeFgSegPlacements(
      fgSegs,
      fgSegHorizontals,
      segHeightRefMap.current,
      moreLinkHeightRefMap.current,
      options.eventOrderStrict,
      options.eventMaxStack,
    )
    this.totalHeight = totalHeight

    return (
      <div
        className={joinClassNames(
          classNames.rel,
          classNames.noShrink,
        )}
        style={{
          height: totalHeight,
        }}
      >
        {this.renderFgSegs(
          fgSegs,
          fgSegHorizontals,
          fgSegTops,
          hiddenGroups,
          hiddenGroupTops,
          /* isMirror = */ false,
        )}
        {this.renderFgSegs(
          mirrorSegs,
          props.slotWidth // TODO: memoize
            ? computeManySegHorizontals(
              mirrorSegs,
              options.eventMinWidth,
              context.dateEnv,
              tDateProfile,
              props.slotWidth,
              props.clipStart,
              props.clipEnd,
            )
            : {},
          fgSegTops,
          /* hiddenGroups = */ [],
          /* hiddenGroupTops = */ new Map(),
          /* isMirror = */ true,
        )}
      </div>
    )
  }

  renderFgSegs(
    segs: (TimelineRange & EventRangeProps)[],
    segHorizontals: { [instanceId: string]: CoordSpan },
    segTops: Map<string, number>,
    hiddenGroups: SegGroup<TimelineCoordRange>[],
    hiddenGroupTops: Map<string, number>,
    isMirror: boolean,
  ) {
    const { props, segHeightRefMap, moreLinkHeightRefMap } = this

    return (
      <>
        {segs.map((seg) => {
          const { eventRange } = seg
          const { instanceId } = eventRange.instance
          const segTop = segTops.get(instanceId)
          const segHorizontalMaybe = segHorizontals[instanceId]
          const segHorizontal: Partial<CoordSpan> = segHorizontalMaybe || {}

          const isDragging = Boolean(props.eventDrag && props.eventDrag.affectedInstances[instanceId])
          const isResizing = Boolean(props.eventResize && props.eventResize.affectedInstances[instanceId])
          const isInvisible = !isMirror && (isDragging || isResizing || !segHorizontalMaybe || segTop == null)
          const isSelected = instanceId === props.eventSelection

          return (
            <TimelineEventHarness
              key={instanceId}
              style={{
                visibility: isInvisible ? 'hidden' : undefined,
                zIndex: isSelected ? 1000 : 1, // scope z-indexes within; HACK: relies on hardcoded z-index offset; fragile if stacking context changes
                top: segTop || 0,
                insetInlineStart: segHorizontal.start,
                width: segHorizontal.size,
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
                isMirror={isMirror}
                isSelected={isSelected}
                {...getEventRangeMeta(eventRange, props.todayRange, props.nowDate)}
              />
            </TimelineEventHarness>
          )
        })}
        {/* TODO: need different parents for separate array keys? */}
        {hiddenGroups.map((hiddenGroup) => (
          <TimelineEventHarness
            key={hiddenGroup.key}
            style={{
              top: hiddenGroupTops.get(hiddenGroup.key) || 0,
              insetInlineStart: hiddenGroup.start,
              width: hiddenGroup.end - hiddenGroup.start,
            }}
            heightRef={moreLinkHeightRefMap.createRef(hiddenGroup.key)}
          >
            <TimelineLaneMoreLink
              hiddenSegs={hiddenGroup.segs}
              dateProfile={props.dateProfile}
              nowDate={props.nowDate}
              todayRange={props.todayRange}
              isTimeScale={props.tDateProfile.isTimeScale}
              eventDrag={props.eventDrag}
              eventResize={props.eventResize}
              eventSelection={props.eventSelection}
              resourceId={props.resourceId}
            />
          </TimelineEventHarness>
        ))}
      </>
    )
  }

  private handleMoreLinkHeights = () => {
    if (this._isUnmounting) return
    this.setState({ moreLinkHeightRev: this.moreLinkHeightRefMap.rev }) // will trigger rerender
  }

  private handleSegHeights = () => {
    if (this._isUnmounting) return
    this.setState({ segHeightRev: this.segHeightRefMap.rev }) // will trigger rerender
  }

  componentDidMount(): void {
    this._isUnmounting = false
    this.fireHeight() // could be ready to fire if zero events and zero height
  }

  componentDidUpdate(): void {
    this.fireHeight()
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
    this.firedTotalHeight = undefined
    setRef(this.props.heightRef, null)
  }

  fireHeight() {
    if (this.totalHeight !== this.firedTotalHeight) {
      this.firedTotalHeight = this.totalHeight
      setRef(this.props.heightRef, this.totalHeight)
    }
  }
}
