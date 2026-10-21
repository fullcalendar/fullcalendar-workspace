/*
The dateClick, select and unselect callbacks: what they receive, and triggering the last two
*/
import { PointerDragEvent } from './pointer-types'
import { buildDateSpanApi, DateSpanApi, DatePointApi, DateSpan } from '../events/date-span'
import { CalendarContext } from '../context/CalendarContext'
import { ViewApi } from '../api/ViewApi'
import { ViewImpl } from '../api/ViewImpl'

export interface DateClickApi extends DatePointApi {
  dayEl: HTMLElement
  jsEvent: UIEvent
  view: ViewApi
}

export interface DateSelectionApi extends DateSpanApi {
  jsEvent: UIEvent
  view: ViewApi
}

export interface DateSelectInfo extends DateSpanApi {
  jsEvent: MouseEvent | null
  view: ViewApi
}

export function triggerDateSelect(selection: DateSpan, pev: PointerDragEvent | null, context: CalendarContext & { viewApi?: ViewImpl }) {
  context.emitter.trigger('select', {
    ...buildDateSpanApiWithContext(selection, context),
    jsEvent: pev ? pev.origEvent as MouseEvent : null, // Is this always a mouse event? See #4655
    view: context.viewApi || context.calendarApi.view,
  } as DateSelectInfo)
}

export interface DateUnselectInfo {
  jsEvent: MouseEvent
  view: ViewApi
}

export function triggerDateUnselect(pev: PointerDragEvent | null, context: CalendarContext & { viewApi?: ViewImpl }) {
  context.emitter.trigger('unselect', {
    jsEvent: pev ? pev.origEvent as MouseEvent : null, // Is this always a mouse event? See #4655
    view: context.viewApi || context.calendarApi.view,
  } as DateUnselectInfo)
}

export function buildDateSpanApiWithContext(dateSpan: DateSpan, context: CalendarContext) {
  let props = {} as DateSpanApi

  for (let transform of context.pluginHooks.dateSpanTransforms) {
    Object.assign(props, transform(dateSpan, context))
  }

  Object.assign(props, buildDateSpanApi(dateSpan, context.dateEnv))

  return props
}
