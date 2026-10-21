import { EventRenderRange } from '../../event-segs/event-ranges'
import { buildRangeEdgeOutput } from '../../events/event-instance'
import {
  DateRange,
  rangeContainsMarker,
  DateFormatter,
  addMs,
  DateMarker,
  startOfDay,
  joinDateTimeFormatParts,
  DateTimeRangeFormatPartWithWeek,
} from '@full-ui/headless-calendar'
import { EventImpl } from '../../api/EventImpl'
import { EventApi } from '../../api/EventApi'
import { ViewContext } from '../../context/ViewContext'
import { ViewApi } from '../../api/ViewApi'
import { createAriaKeyboardAttrs } from '../../util/dom-event'
import { Dictionary } from '../../util/object'

/*
What an event component shows and passes to the render hooks: the info objects, the time text, its
tag and attributes, whether it's draggable, and where its range sits relative to today
*/

export interface MinimalEventProps {
  eventRange: EventRenderRange // timed/whole-day span
  slicedStart?: DateMarker // view-sliced timed/whole-day span
  slicedEnd?: DateMarker // view-sliced timed/whole-day span
  isStart: boolean
  isEnd: boolean
  isFirst?: boolean
  isLast?: boolean
  isDragging: boolean // rename to isMirrorDragging? make optional?
  isResizing: boolean // rename to isMirrorResizing? make optional?
  isMirror: boolean
  isSelected: boolean
  isPast: boolean
  isFuture: boolean
  isToday: boolean
  renderProps?: Dictionary // so can include a resource
}

export interface EventTextInfo { // for *TimeClass/*TitleClass handlers
  event: EventApi
  timeText: string
  isNarrow: boolean
  isShort: boolean
}

export interface EventDisplayInfo extends EventTextInfo { // for *Content handlers
  event: EventImpl
  color: string // TODO: add other EventUi props?
  contrastColor: string //
  isDraggable: boolean
  isStartResizable: boolean
  isEndResizable: boolean
  isMirror: boolean
  isStart: boolean
  isEnd: boolean
  isFirst: boolean
  isLast: boolean
  isPast: boolean
  isFuture: boolean
  isToday: boolean
  isSelected: boolean
  isDragging: boolean
  isResizing: boolean
  isInteractive: boolean
  view: ViewApi // specifically for the API

  level: number
  timeClass: string
  titleClass: string

  options: { eventOverlap: boolean }
}

export function computeEventRangeDraggable(eventRange: EventRenderRange, context: ViewContext) {
  let { pluginHooks } = context
  let transformers = pluginHooks.isDraggableTransformers
  let { def, ui } = eventRange
  let val = ui.startEditable

  for (let transformer of transformers) {
    val = transformer(val, def, ui, context)
  }

  return val
}

/*
slicedStart/slicedEnd are optionally supplied to signal where breaks occur in view-specific segment
a better approach is to always slice with dates and always supply this argument,
however, daygrid only slices by row/col
*/
export function buildEventRangeTimeText(
  timeFormat: DateFormatter,
  eventRange: EventRenderRange, // timed/whole-day span
  slicedStart: DateMarker | undefined, // view-sliced timed/whole-day span
  slicedEnd: DateMarker | undefined, // view-sliced timed/whole-day span
  isStart: boolean,
  isEnd: boolean,
  context: ViewContext,
  defaultDisplayEventTime = true,
  defaultDisplayEventEnd = true,
): string {
  const { dateEnv, options } = context
  const { def } = eventRange
  const { range } = eventRange.instance
  const canonicalStart = buildRangeEdgeOutput(range.start, range.instantStartMs, dateEnv)
  const canonicalEnd = buildRangeEdgeOutput(range.end, range.instantEndMs, dateEnv)
  let { displayEventTime, displayEventEnd } = options

  if (displayEventTime == null) { displayEventTime = defaultDisplayEventTime !== false }
  if (displayEventEnd == null) { displayEventEnd = defaultDisplayEventEnd !== false }

  const startDate = (
    !isStart &&
    slicedStart &&
    // if seg is the first seg, but start-date cut-off by slotMinTime, (technically isStart=false)
    // we still want to display the original start-time
    startOfDay(slicedStart).valueOf() !== startOfDay(canonicalStart.marker).valueOf()
  )
    ? slicedStart
    : canonicalStart.marker

  const endDate = (
    !isEnd &&
    slicedEnd &&
    // See above HACK, but for end-time
    startOfDay(addMs(slicedEnd, -1)).valueOf() !== startOfDay(addMs(canonicalEnd.marker, -1)).valueOf()
  )
    ? slicedEnd
    : canonicalEnd.marker
  const startInstantMs = startDate === canonicalStart.marker ? canonicalStart.date.valueOf() : undefined
  const endInstantMs = endDate === canonicalEnd.marker ? canonicalEnd.date.valueOf() : undefined

  if (displayEventTime && !def.allDay) {
    if (displayEventEnd && (isStart || isEnd) && def.hasEnd) {
      // TODO: put this functionality in @full-ui/headless-calendar ?
      const rangeParts = dateEnv.formatRangeToParts(startDate, endDate, timeFormat, {
        startInstantMs,
        endInstantMs,
      })
      const multiDaySeparator = detectMultiDayTimes(rangeParts)
      // NOTE: produces strings like '12:00pm - 1:00pm', without condensing dayPeriod,
      // but that's okay since it's technically a different dayPeriod on a different day
      if (multiDaySeparator != null) {
        return joinDateTimeFormatParts(dateEnv.formatToParts(startDate, timeFormat, {
          instantMs: startInstantMs,
        })) +
          multiDaySeparator +
          joinDateTimeFormatParts(dateEnv.formatToParts(endDate, timeFormat, {
            instantMs: endInstantMs,
          }))
      }

      return joinDateTimeFormatParts(rangeParts)
    }

    if (isStart) {
      return joinDateTimeFormatParts(dateEnv.formatToParts(startDate, timeFormat, {
        instantMs: startInstantMs,
      }))
    }
  }

  return ''
}

const dateUnits = new Set(['year', 'month', 'day']) // TODO: DRY

function detectMultiDayTimes(parts: DateTimeRangeFormatPartWithWeek[]): string | undefined {
  let sharedPart: DateTimeRangeFormatPartWithWeek | undefined
  let hasDatePart = false

  for (const part of parts) {
    if (part.source === 'shared') {
      sharedPart = part
    } if (dateUnits.has(part.type)) {
      hasDatePart = true
    }
  }

  return hasDatePart ? sharedPart.value : undefined
}

export function getEventRangeMeta(
  eventRange: EventRenderRange,
  todayRange: DateRange,
  nowDate?: DateMarker,
  nowMs?: number,
) {
  let segRange = eventRange.range

  return {
    isPast: segRange.instantEndMs != null && nowMs != null
      ? segRange.instantEndMs <= nowMs
      : segRange.end <= (nowDate || todayRange.start),
    isFuture: segRange.instantStartMs != null && nowMs != null
      ? segRange.instantStartMs >= nowMs
      : segRange.start >= (nowDate || todayRange.end),
    isToday: todayRange && rangeContainsMarker(todayRange, segRange.start),
  }
}


export function getEventTagAndAttrs(eventRange: EventRenderRange, context: ViewContext): [
  tag: string,
  attrs: any, // TODO
  isInteractive: boolean,
] {
  let { def, instance } = eventRange
  let { url } = def

  if (url) {
    return ['a', { href: url }, true]
  }

  let { emitter, options } = context
  let { eventInteractive } = options

  if (eventInteractive == null) {
    eventInteractive = def.interactive
    if (eventInteractive == null) {
      eventInteractive = Boolean(emitter.hasHandlers('eventClick'))
    }
  }

  let attrs: any

  // mock what happens in EventClicking
  if (eventInteractive) {
    // only attach keyboard-related handlers because click handler is already done in EventClicking
    attrs = createAriaKeyboardAttrs((ev: UIEvent) => {
      emitter.trigger('eventClick', {
        el: ev.target as HTMLElement,
        event: new EventImpl(context, def, instance),
        jsEvent: ev as MouseEvent,
        view: context.viewApi,
      })
    })
    attrs = { role: 'button', ...attrs }
  }

  return ['div', attrs, eventInteractive]
}
