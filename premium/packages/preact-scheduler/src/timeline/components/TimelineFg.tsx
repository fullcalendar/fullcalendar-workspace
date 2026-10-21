import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  useLatest, useDateEnv, useViewOptions,
  getEventRangeMeta, DateEnv, DateMarker, DateRange, DateProfile, Dictionary, sortEventSegs,
  RefMap,
  afterSize,
  EventRangeProps,
  setRef,
  SlicedEventInteraction,
  MeasuredHeightHarness,
  type Slice,
  getSliceKey,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { memo, useLayoutEffect, useMemo, useRef, useState, type Ref } from 'react'
import { TimelineDateProfile } from '../timeline-date-profile'
import { TimelineRange } from '../TimelineLaneSlicer'
import { TimelineEvent } from './TimelineEvent'
import { TimelineLaneMoreLink } from './TimelineLaneMoreLink'
import {
  buildTimelineSegPlacements,
  buildTimelineSegSources,
  type TimelineSegMoreLink,
  type TimelineSourceSeg,
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
  eventDrag: SlicedEventInteraction<TimelineRange> | null
  eventResize: SlicedEventInteraction<TimelineRange> | null
  eventSelection: string
  dateSpanProps?: Dictionary // so can include a resource
  renderProps?: Dictionary // so can include a resource

  // a11y
  label?: string

  // dimensions
  slotWidth: number | undefined

  // virtualization (optional)
  clipStart?: number
  clipEnd?: number

  // ref
  heightRef?: Ref<number>
}

export const TimelineFg = memo(function TimelineFg(props: TimelineFgProps) {
  const dateEnv = useDateEnv()
  const options = useViewOptions()
  const { tDateProfile } = props

  // measurements. a new rev re-renders
  const [, setSegHeightRev] = useState<string | undefined>(undefined)
  const [, setMoreLinkHeightRev] = useState<string | undefined>(undefined)
  const isActiveRef = useRef(false)
  const [refMaps] = useState(() => {
    const sliceHeightRefMap = new RefMap<string, number>(() => { // keyed by slice part key
      afterSize(() => {
        if (isActiveRef.current) {
          setSegHeightRev(sliceHeightRefMap.rev)
        }
      })
    })
    const moreLinkHeightRefMap = new RefMap<string, number>(() => { // keyed by stable more-link key
      afterSize(() => {
        if (isActiveRef.current) {
          setMoreLinkHeightRev(moreLinkHeightRefMap.rev) // will trigger rerender
        }
      })
    })
    return { sliceHeightRefMap, moreLinkHeightRefMap }
  })
  const { sliceHeightRefMap, moreLinkHeightRefMap } = refMaps

  let mirrorSegs =
    (props.eventDrag ? props.eventDrag.segs : null) ||
    (props.eventResize ? props.eventResize.segs : null) ||
    []

  let fgSegs = useMemo(
    () => sortEventSegs(props.fgEventSegs, options.eventOrder),
    [props.fgEventSegs, options.eventOrder],
  )
  const projectionSizing = resolveTimelineEventProjectionSizing(
    props.slotWidth,
    options.eventMinWidth,
  )
  let sourceSegs = useMemo(
    () => buildTimelineSegSources(
      fgSegs,
      projectionSizing.eventMinWidth,
      dateEnv,
      tDateProfile,
      projectionSizing.slotWidth,
      props.clipStart,
      props.clipEnd,
    ),
    [
      fgSegs, projectionSizing.eventMinWidth, dateEnv, tDateProfile, projectionSizing.slotWidth,
      props.clipStart, props.clipEnd,
    ],
  )
  const allSegsProjected = sourceSegs.length === fgSegs.length
  let placementResult = buildTimelineSegPlacements(
    sourceSegs,
    options.eventOrderStrict,
    options.eventMaxStack,
    sliceHeightRefMap.current,
    moreLinkHeightRefMap.current,
  )

  const totalHeight = placementResult.contentHeight
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
  const totalHeightSettled = props.slotWidth != null &&
    allSegsProjected &&
    placementResult.isSettled

  // reports the height after each commit that settles a new one. could be ready to fire on mount, if
  // zero events and zero height
  const firedTotalHeightRef = useRef<number | undefined>(undefined)
  const heightRefRef = useLatest(props.heightRef)
  useLayoutEffect(() => {
    if (totalHeightSettled && totalHeight !== firedTotalHeightRef.current) {
      firedTotalHeightRef.current = totalHeight
      setRef(props.heightRef, totalHeight)
    }
  })
  useLayoutEffect(() => {
    isActiveRef.current = true

    return () => {
      isActiveRef.current = false
      firedTotalHeightRef.current = undefined
      setRef(heightRefRef.current, null)
    }
  }, [])

  const hasListItems = Boolean(
    placementResult.renderSlices.length || placementResult.moreLinks.length,
  )

  return (
    <div
      // events and more-links are list items. mirrors are aria-hidden
      {...(hasListItems ? { role: 'list', 'aria-label': props.label } : {})}
      className={joinClassNames(
        classNames.rel,
        classNames.noShrink,
      )}
      style={{
        height: placementResult.contentHeight,
      }}
    >
      {renderEventSlices(
        props,
        placementResult.renderSlices,
        placementResult.sliceCoords,
        sliceHeightRefMap,
      )}
      {renderMirrorSegs(props, options.eventMinWidth, dateEnv, mirrorSegs, placementResult.sliceCoords)}
      {renderMoreLinks(props, placementResult.moreLinks, moreLinkHeightRefMap)}
    </div>
  )
})

function renderEventSlices(
  props: TimelineFgProps,
  renderSlices: Slice<TimelineSourceSeg>[],
  sliceCoords: ReadonlyMap<string, number>,
  sliceHeightRefMap: RefMap<string, number>,
) {
  return (
    <>
      {renderSlices.map((slice) => {
        const key = getSliceKey(slice)
        const seg = slice.sourceSeg
        const top = sliceCoords.get(key)
        const { eventRange } = seg
        const { instanceId } = eventRange.instance

        const isDragging = Boolean(props.eventDrag && props.eventDrag.affectedInstances[instanceId])
        const isResizing = Boolean(props.eventResize && props.eventResize.affectedInstances[instanceId])
        const isInvisible = isDragging || isResizing || top == null
        const isSelected = instanceId === props.eventSelection

        return (
          <MeasuredHeightHarness
            key={key}
            attrs={{ role: 'listitem' }}
            className={joinClassNames(
              classNames.abs,
              isSelected ? classNames.z1000 : classNames.z1,
            )}
            style={{
              visibility: isInvisible ? 'hidden' : undefined,
              top,
              insetInlineStart: slice.start,
              width: slice.end - slice.start,
            }}
            heightRef={sliceHeightRefMap.createRef(key)}
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
              renderProps={props.renderProps}
              {...getEventRangeMeta(eventRange, props.todayRange, props.nowDate, props.nowMs)}
            />
          </MeasuredHeightHarness>
        )
      })}
    </>
  )
}

// Mirrors bypass normal-event admission so limits cannot hide them or create more links.
function renderMirrorSegs(
  props: TimelineFgProps,
  eventMinWidth: number,
  dateEnv: DateEnv,
  segs: (TimelineRange & EventRangeProps)[],
  fgSegTops: ReadonlyMap<string, number>,
) {
  const projectionSizing = resolveTimelineEventProjectionSizing(
    props.slotWidth,
    eventMinWidth,
  )

  return segs.map((seg) => {
    const { eventRange } = seg
    const { instanceId } = eventRange.instance
    const horizontal = computeSegHorizontals(
      seg,
      projectionSizing.eventMinWidth,
      dateEnv,
      props.tDateProfile,
      projectionSizing.slotWidth,
      props.clipStart,
      props.clipEnd,
    )
    const isDragging = Boolean(props.eventDrag && props.eventDrag.affectedInstances[instanceId])
    const isResizing = Boolean(props.eventResize && props.eventResize.affectedInstances[instanceId])
    const isSelected = instanceId === props.eventSelection

    return (
      <MeasuredHeightHarness
        key={instanceId}
        attrs={{ 'aria-hidden': true }}
        className={joinClassNames(
          classNames.abs,
          isSelected ? classNames.z1000 : classNames.z1,
        )}
        style={{
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
          renderProps={props.renderProps}
          {...getEventRangeMeta(eventRange, props.todayRange, props.nowDate, props.nowMs)}
        />
      </MeasuredHeightHarness>
    )
  })
}

function renderMoreLinks(
  props: TimelineFgProps,
  moreLinks: TimelineSegMoreLink[],
  moreLinkHeightRefMap: RefMap<string, number>,
) {
  return (
    <>
      {moreLinks.map((moreLink) => (
        <MeasuredHeightHarness
          key={moreLink.key}
          attrs={{ role: 'listitem' }}
          className={classNames.abs}
          style={{
            top: moreLink.top,
            insetInlineStart: moreLink.start,
            width: moreLink.end - moreLink.start,
          }}
          heightRef={moreLinkHeightRefMap.createRef(moreLink.key)}
        >
          <TimelineLaneMoreLink
            hiddenSegs={moreLink.segs}
            dateProfile={props.dateProfile}
            nowDate={props.nowDate}
            nowMs={props.nowMs}
            todayRange={props.todayRange}
            isTimeScale={props.tDateProfile.isTimeScale}
            eventDrag={props.eventDrag}
            eventResize={props.eventResize}
            eventSelection={props.eventSelection}
            dateSpanProps={props.dateSpanProps}
            renderProps={props.renderProps}
          />
        </MeasuredHeightHarness>
      ))}
    </>
  )
}
