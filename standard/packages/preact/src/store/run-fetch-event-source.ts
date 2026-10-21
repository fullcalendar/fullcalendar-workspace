import { DateRange } from '@full-ui/headless-calendar'
import { CalendarContext } from '../context/CalendarContext'
import { EventSource } from '../event-sources/event-source'
import { warn } from '../util/warn'
import { Effect } from './effects'

export interface FetchEventSourceEffect extends Effect {
  type: 'fetchEventSource'
  eventSource: EventSource<any> // as it was before the reduction marked it fetching
  fetchId: string
  range: DateRange
  isRefetch: boolean
  context: CalendarContext
}

// runs a source's fetch. results come back as actions, as they always have
export function runEventSourceFetch(effect: FetchEventSourceEffect): void {
  let { eventSource, fetchId, range: fetchRange, isRefetch, context } = effect
  let { options, calendarApi } = context
  let sourceDef = context.pluginHooks.eventSourceDefs[eventSource.sourceDefId]

  sourceDef.fetch(
    {
      eventSource,
      range: fetchRange,
      isRefetch,
      context,
    },
    (res) => {
      let { rawEvents } = res

      if (options.eventSourceSuccess) {
        rawEvents = options.eventSourceSuccess.call(calendarApi, rawEvents, res.response) || rawEvents
      }

      if (eventSource.success) {
        rawEvents = eventSource.success.call(calendarApi, rawEvents, res.response) || rawEvents
      }

      context.dispatch({
        type: 'RECEIVE_EVENTS',
        sourceId: eventSource.sourceId,
        fetchId,
        fetchRange,
        rawEvents,
      })
    },
    (error) => {
      let errorHandled = false

      if (options.eventSourceFailure) {
        options.eventSourceFailure.call(calendarApi, error)
        errorHandled = true
      }

      if (eventSource.failure) {
        eventSource.failure(error)
        errorHandled = true
      }

      if (!errorHandled) {
        warn(`Unhandled event source error: ${error.message}`, error)
      }

      context.dispatch({
        type: 'RECEIVE_EVENT_ERROR',
        sourceId: eventSource.sourceId,
        fetchId,
        fetchRange,
        error,
      })
    },
  )
}
