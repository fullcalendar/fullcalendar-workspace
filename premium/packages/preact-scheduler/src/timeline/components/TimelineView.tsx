import {
  ViewProps,
  createViewComponent,
  greatestDurationDenominator,
  useMeasuredState,
  useNow,
  useViewContext,
} from '@fullcalendar/preact/protected-api'
import { useMemo, useRef, useState } from 'react'
import { buildTimelineDateProfile } from '../timeline-date-profile'
import { computeSlotWidth } from '../timeline-positioning'
import { TimelineLaneSlicer } from '../TimelineLaneSlicer'
import { TimelineLayoutPrint } from './TimelineLayoutPrint'
import { TimelineLayoutNormal, TimelineScroll } from './TimelineLayoutNormal'

// memoized on its props, and marked as a view (see createViewComponent)
export const TimelineView = createViewComponent(TimelineViewBody)

function TimelineViewBody(props: ViewProps) {
  const context = useViewContext()
  const { options } = context
  const [clientWidth, handleClientWidth] = useMeasuredState()
  const [slotInnerWidth, handleSlotInnerWidth] = useMeasuredState()

  // the layout's scroll, kept here because print replaces the layout. see TimelineLayoutNormal
  const scrollRef = useRef<TimelineScroll | null>(null)

  /* date */

  const tDateProfile = useMemo(
    () => buildTimelineDateProfile(
      props.dateProfile,
      context.dateEnv,
      options,
      context.dateProfileGenerator,
    ),
    [props.dateProfile, context.dateEnv, options, context.dateProfileGenerator],
  )
  let { unit: timerUnit, value: timerUnitValue } = greatestDurationDenominator(tDateProfile.slotDuration)
  const { nowDate, todayRange, nowMs } = useNow(timerUnit, timerUnitValue)

  /* table positions */

  const [canvasWidth, slotWidth] = useMemo(
    () => computeSlotWidth(
      tDateProfile.slotCnt,
      tDateProfile.slotsPerLabel,
      options.slotMinWidth,
      slotInnerWidth, // is ACTUALLY the label width. rename?
      clientWidth,
    ),
    [tDateProfile.slotCnt, tDateProfile.slotsPerLabel, options.slotMinWidth, slotInnerWidth, clientWidth],
  )

  /* sliced */

  const [slicer] = useState(() => new TimelineLaneSlicer())
  let slicedProps = slicer.sliceProps(
    props,
    props.dateProfile,
    tDateProfile.isTimeScale ? null : options.nextDayThreshold,
    context, // wish we didn't have to pass in the rest of the args...
    props.dateProfile,
    context.dateProfileGenerator,
    tDateProfile,
    context.dateEnv,
  )

  const baseProps = {
    className: props.className,
    dateProfile: props.dateProfile,
    tDateProfile,
    nowDate,
    nowMs,
    todayRange,
    slicedProps,
    canvasWidth,
    slotWidth,
  }

  return props.forPrint ? (
    <TimelineLayoutPrint
      {...baseProps}
      timeCanvasClipStart={scrollRef.current?.x ?? 0}
    />
  ) : (
    <TimelineLayoutNormal
      {...baseProps}
      clientWidth={clientWidth}
      clientWidthRef={handleClientWidth}
      slotInnerWidthRef={handleSlotInnerWidth}
      initialScroll={scrollRef.current ?? undefined}
      scrollRef={scrollRef}
    />
  )
}
