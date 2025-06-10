import { ViewApi, EventApi, DatePointApi } from '@fullcalendar/core'
import { DateSpan, CalendarContext, DateEnv } from '@fullcalendar/core/internal'

export interface DropData extends DatePointApi {
  draggedEl: HTMLElement
  jsEvent: MouseEvent
  view: ViewApi
}

export type EventReceiveData = EventReceiveLeaveData
export type EventLeaveData = EventReceiveLeaveData
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
  return {
    date: dateEnv.toDate(span.range.start),
    dateStr: dateEnv.formatIso(span.range.start, { omitTime: span.allDay }),
    allDay: span.allDay,
  }
}
