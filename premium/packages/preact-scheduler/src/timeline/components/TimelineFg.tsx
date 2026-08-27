import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  BaseComponent, memoize,
  getEventRangeMeta, DateMarker, DateRange, DateProfile, sortEventSegs,
  RefMap,
  afterSize,
  EventRangeProps,
  setRef,
  EventSegUiInteractionState,
  MeasuredAbsoluteHarness,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { type Ref } from 'react'
import { TimelineDateProfile } from '../timeline-date-profile'
import { TimelineRange } from '../TimelineLaneSlicer'
import { TimelineEvent } from './TimelineEvent'
import { TimelineLaneMoreLink } from './TimelineLaneMoreLink'
import {
  buildTimelineSegPlacementPlan,
  buildTimelineSegPlacements,
  type TimelineSegDomItem,
  type TimelineSegMoreLink,
} from '../seg-placement-adapter'
import { resolveTimelineEventProjectionSizing } from '../slot-estimate'
import { computeSegHorizontals } from '../timeline-positioning'

export interface TimelineFgProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  nowMs: number
  todayRange: DateRange

  // content
  fgEventSegs: (TimelineRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<TimelineRange> | null
  eventResize: EventSegUiInteractionState<TimelineRange> | null
  eventSelection: string
  resourceId?: string // hack

  // dimensions
  slotWidth: number | undefined

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
  private buildSegPlacementPlan = memoize(buildTimelineSegPlacementPlan)

  // refs
  private sliceHeightRefMap = new RefMap<string, number>(() => { // keyed by slice part key
    afterSize(this.handleSegHeights)
  })
  private moreLinkHeightRefMap = new RefMap<string, number>(() => { // keyed by stable more-link key
    afterSize(this.handleMoreLinkHeights)
  })

  // internal
  private _isUnmounting: boolean
  private totalHeight?: number
  private totalHeightSettled?: boolean
  private firedTotalHeight?: number

  render() {
    let { props, context, sliceHeightRefMap, moreLinkHeightRefMap } = this
    let { options } = context
    let { tDateProfile } = props

    let mirrorSegs =
      (props.eventDrag ? props.eventDrag.segs : null) ||
      (props.eventResize ? props.eventResize.segs : null) ||
      []

    let fgSegs = this.sortEventSegs(props.fgEventSegs, options.eventOrder)
    const projectionSizing = resolveTimelineEventProjectionSizing(
      props.slotWidth,
      options.eventMinWidth,
    )
    let plan = this.buildSegPlacementPlan(
      fgSegs,
      context.dateEnv,
      tDateProfile,
      projectionSizing.slotWidth,
      projectionSizing.eventMinWidth,
      options.eventOrderStrict,
      options.eventMaxStack,
      props.clipStart,
      props.clipEnd,
    )
    let placementResult = buildTimelineSegPlacements(
      plan,
      sliceHeightRefMap.current,
      moreLinkHeightRefMap.current,
    )
    let fgSegTops = new Map<string, number>()
    for (const item of placementResult.eventDomItems) {
      if (item.top != null) {
        fgSegTops.set(item.key, item.top)
      }
    }

    this.totalHeight = placementResult.contentHeight
    /*
    An assumed slot width may paint, but it may not report a height upward.
    Height is latched by the consumer, and `allSegsProjected` can go false later
    — a virtualized clip that excludes any seg blocks every subsequent fire — so
    a provisional height reported now could be the last one a resource lane ever
    receives.

    Once the width is measured the remaining gates are unchanged, so no lane
    loses a height it used to get. The one deliberate difference: an empty lane
    used to report 0 immediately, and now waits for the width. That strictness
    is wanted — it stops an empty lane from latching 0 before its events arrive.
    */
    this.totalHeightSettled = props.slotWidth != null &&
      plan.allSegsProjected &&
      placementResult.allHeightsSettled

    return (
      <div
        className={joinClassNames(
          classNames.rel,
          classNames.noShrink,
        )}
        style={{
          height: placementResult.contentHeight,
        }}
      >
        {this.renderEventDomItems(placementResult.eventDomItems)}
        {this.renderMirrorSegs(mirrorSegs, fgSegTops)}
        {this.renderMoreLinks(placementResult.moreLinks)}
      </div>
    )
  }

  renderEventDomItems(eventDomItems: TimelineSegDomItem[]) {
    const { props } = this

    return (
      <>
        {eventDomItems.map((item) => {
          const { key, seg, horizontal, top } = item
          const { eventRange } = seg
          const { instanceId } = eventRange.instance

          const isDragging = Boolean(props.eventDrag && props.eventDrag.affectedInstances[instanceId])
          const isResizing = Boolean(props.eventResize && props.eventResize.affectedInstances[instanceId])
          const isInvisible = isDragging || isResizing || top == null
          const isSelected = instanceId === props.eventSelection

          return (
            <MeasuredAbsoluteHarness
              key={key}
              style={{
                visibility: isInvisible ? 'hidden' : undefined,
                zIndex: isSelected ? 1000 : 1, // scope z-indexes within; HACK: relies on hardcoded z-index offset; fragile if stacking context changes
                top,
                insetInlineStart: horizontal.start,
                width: horizontal.size,
              }}
              heightRef={this.sliceHeightRefMap.createRef(key)}
            >
              <TimelineEvent
                isTimeScale={props.tDateProfile.isTimeScale}
                eventRange={eventRange}
                isStart={seg.isStart}
                isEnd={seg.isEnd}
                isDragging={isDragging}
                isResizing={isResizing}
                isMirror={false}
                isSelected={isSelected}
                {...getEventRangeMeta(eventRange, props.todayRange, props.nowDate, props.nowMs)}
              />
            </MeasuredAbsoluteHarness>
          )
        })}
      </>
    )
  }

  // Mirrors bypass normal-event admission so limits cannot hide them or create more links.
  renderMirrorSegs(
    segs: (TimelineRange & EventRangeProps)[],
    fgSegTops: ReadonlyMap<string, number>,
  ) {
    const { props, context } = this
    const projectionSizing = resolveTimelineEventProjectionSizing(
      props.slotWidth,
      context.options.eventMinWidth,
    )

    return segs.map((seg) => {
      const { eventRange } = seg
      const { instanceId } = eventRange.instance
      const horizontal = computeSegHorizontals(
        seg,
        projectionSizing.eventMinWidth,
        context.dateEnv,
        props.tDateProfile,
        projectionSizing.slotWidth,
        props.clipStart,
        props.clipEnd,
      )
      const isDragging = Boolean(props.eventDrag && props.eventDrag.affectedInstances[instanceId])
      const isResizing = Boolean(props.eventResize && props.eventResize.affectedInstances[instanceId])
      const isSelected = instanceId === props.eventSelection

      return (
        <MeasuredAbsoluteHarness
          key={instanceId}
          style={{
            zIndex: isSelected ? 1000 : 1, // scope z-indexes within; HACK: relies on hardcoded z-index offset; fragile if stacking context changes
            top: fgSegTops.get(instanceId) ?? 0,
            insetInlineStart: horizontal?.start,
            width: horizontal && horizontal.end - horizontal.start,
          }}
        >
          <TimelineEvent
            isTimeScale={props.tDateProfile.isTimeScale}
            eventRange={eventRange}
            isStart={seg.isStart}
            isEnd={seg.isEnd}
            isDragging={isDragging}
            isResizing={isResizing}
            isMirror
            isSelected={isSelected}
            {...getEventRangeMeta(eventRange, props.todayRange, props.nowDate, props.nowMs)}
          />
        </MeasuredAbsoluteHarness>
      )
    })
  }

  renderMoreLinks(moreLinks: TimelineSegMoreLink[]) {
    const { props, moreLinkHeightRefMap } = this

    return (
      <>
        {moreLinks.map((link) => (
          <MeasuredAbsoluteHarness
            key={link.key}
            style={{
              top: link.top,
              insetInlineStart: link.start,
              width: link.end - link.start,
            }}
            heightRef={moreLinkHeightRefMap.createRef(link.key)}
          >
            <TimelineLaneMoreLink
              hiddenSegs={link.segs}
              dateProfile={props.dateProfile}
              nowDate={props.nowDate}
              nowMs={props.nowMs}
              todayRange={props.todayRange}
              isTimeScale={props.tDateProfile.isTimeScale}
              eventDrag={props.eventDrag}
              eventResize={props.eventResize}
              eventSelection={props.eventSelection}
              resourceId={props.resourceId}
            />
          </MeasuredAbsoluteHarness>
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
    this.setState({ segHeightRev: this.sliceHeightRefMap.rev })
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
    if (
      this.totalHeightSettled &&
      this.totalHeight !== this.firedTotalHeight
    ) {
      this.firedTotalHeight = this.totalHeight
      setRef(this.props.heightRef, this.totalHeight)
    }
  }
}
