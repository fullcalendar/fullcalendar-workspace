import { SlotLaneInfo, joinClassNames } from '@fullcalendar/preact/public-api'
import {
  DateMarker,
  DateProfile,
  DateRange, getDateMeta,
  isInt,
  useRenderHookEl,
  useViewContext,
} from '@fullcalendar/preact/protected-api'
import { memo, useMemo } from 'react'
import classNames from '@fullcalendar/preact/protected-styles'
import { TimelineDateProfile } from '../timeline-date-profile'
import { applyExactSlotMeta } from '../timeline-time-axis'

export interface TimelineSlatCellProps {
  date: DateMarker
  startMs: number | null
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  nowMs: number
  todayRange: DateRange
  isMajor: boolean
  borderStart: boolean

  // dimensions
  width: number | undefined // always provided. if pending, use `undefined`
}

export const TimelineSlatCell = memo(function TimelineSlatCell(props: TimelineSlatCellProps) {
  let context = useViewContext()
  let { dateEnv, options } = context
  let { date, tDateProfile, isMajor } = props
  let baseDateMeta = useMemo(
    () => getDateMeta(props.date, dateEnv, props.dateProfile, props.todayRange, props.nowDate),
    [props.date, dateEnv, props.dateProfile, props.todayRange, props.nowDate],
  )
  let dateMeta = useMemo(
    () => applyExactSlotMeta(baseDateMeta, props.startMs, props.nowMs),
    [baseDateMeta, props.startMs, props.nowMs],
  )

  let isMinor =
    tDateProfile.isTimeScale &&
    !isInt(dateEnv.countDurationsBetween(
      tDateProfile.normalizedRange.start,
      props.date,
      tDateProfile.labelInterval,
    ))

  let renderProps: SlotLaneInfo = {
    ...dateMeta,
    isMajor,
    isMinor,
    view: context.viewApi,
  }
  let renderHookEl = useRenderHookEl({
    classGenerator: options.slotLaneClass,
    didMount: options.slotLaneDidMount,
    willUnmount: options.slotLaneWillUnmount,
    renderProps,
  })

  return (
    <div
      ref={renderHookEl.ref}
      className={joinClassNames(
        classNames.noMargin,
        classNames.noPadding,
        classNames.alignStart, // shrinks width of InnerContent
        classNames.borderlessY,
        classNames.borderlessEnd,
        !props.borderStart && classNames.borderlessStart,
        classNames.internalTimelineSlot,
        renderHookEl.className,
      )}
      data-date={dateEnv.formatIso(date, {
        omitTimeZoneOffset: true,
        omitTime: !tDateProfile.isTimeScale,
      })}
      aria-current={dateMeta.isToday ? 'date' : undefined}
      style={{
        width: props.width,
      }}
    />
  )
})
