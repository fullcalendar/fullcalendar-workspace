import { ViewApi } from '../api/ViewApi'
import { EventApi } from '../api/EventApi'
import type { DatePointApi } from '../structs/date-span'
import type { DateSpan } from '../structs/date-span'
import { formatInstantIso } from '../structs/date-span'
import type { CalendarContext } from '../CalendarContext'
import type { DateEnv } from '@full-ui/headless-calendar'

export interface DropInfo extends DatePointApi {
  draggedEl: HTMLElement
  jsEvent: MouseEvent
  view: ViewApi
}

export type EventReceiveInfo = EventReceiveLeaveData
export type EventLeaveInfo = EventReceiveLeaveData
export interface EventReceiveLeaveData { // will this become public?
  draggedEl: HTMLElement
  event: EventApi
  relatedEvents: EventApi[]
  revert: () => void
  view: ViewApi
}

export function buildDatePointApiWithContext(dateSpan: DateSpan, context: CalendarContext) {
  let props = {} as DatePointApi

  for (let transform of context.pluginHooks.datePointTransforms) {
    Object.assign(props, transform(dateSpan, context))
  }

  Object.assign(props, buildDatePointApi(dateSpan, context.dateEnv))

  return props
}

export function buildDatePointApi(span: DateSpan, dateEnv: DateEnv): DatePointApi {
  if (!span.allDay && span.instantStartMs != null) {
    return {
      date: new Date(span.instantStartMs),
      dateStr: formatInstantIso(span.instantStartMs, dateEnv),
      allDay: false,
    }
  }

  return {
    date: dateEnv.toDate(span.range.start),
    dateStr: dateEnv.formatIso(span.range.start, { omitTime: span.allDay }),
    allDay: span.allDay,
  }
}
