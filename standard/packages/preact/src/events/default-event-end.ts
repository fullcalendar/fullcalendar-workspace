import { DateMarker, startOfDay } from '@full-ui/headless-calendar'
import { CalendarContext } from '../context/CalendarContext'
import { addDurationToEdge, EventRangeEdge } from './event-instance'

// Given an event's allDay status and start date, return what its fallback end date should be
export function computeDefaultEventEnd(allDay: boolean, marker: DateMarker, context: CalendarContext): DateMarker {
  let { dateEnv, options } = context
  let end = marker

  if (allDay) {
    end = startOfDay(end)
    end = dateEnv.add(end, options.defaultAllDayEventDuration)
  } else {
    end = dateEnv.add(end, options.defaultTimedEventDuration)
  }

  return end
}

// like computeDefaultEventEnd, but edge-based: an exact start yields an exact derived end
// (real elapsed duration), so the end can't re-resolve to the wrong side of a DST fold
export function computeDefaultEventEndEdge(allDay: boolean, start: EventRangeEdge, context: CalendarContext): EventRangeEdge {
  if (allDay) {
    return { marker: computeDefaultEventEnd(true, start.marker, context) }
  }

  return addDurationToEdge(start, context.options.defaultTimedEventDuration, context.dateEnv)
}
