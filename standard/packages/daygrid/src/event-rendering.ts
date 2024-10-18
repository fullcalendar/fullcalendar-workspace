import { createFormatter, DateFormatter, EventRangeProps, SlicedCoordRange } from '@fullcalendar/core/internal'

export const DEFAULT_TABLE_EVENT_TIME_FORMAT: DateFormatter = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  omitZeroMinute: true,
  meridiem: 'narrow',
})

export function hasListItemDisplay(seg: SlicedCoordRange & EventRangeProps) {
  let { display } = seg.eventRange.ui

  return display === 'list-item' || (
    display === 'auto' &&
    !seg.eventRange.def.allDay &&
    (seg.end - seg.start) === 1 && // single-day
    seg.isStart && // "
    seg.isEnd // "
  )
}
