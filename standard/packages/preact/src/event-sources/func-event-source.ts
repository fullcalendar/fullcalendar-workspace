import { PluginInput } from '../plugin-system-struct'
import { buildRangeApiWithTimeZone } from '../structs/date-span'
import { EventInput } from '../structs/event-parse'
import { EventSourceDef } from '../structs/event-source-def'
import { unpromisify } from '../util/promise'

export type EventSourceFuncInfo = {
  start: Date
  end: Date
  startStr: string
  endStr: string
  timeZone: string
}

/*
Gives the source's events, as EventInput[]. Or gives any response, for eventSourceSuccess or the
source's `success` option to turn into EventInput[].
*/
export type EventSourceFunc =
  ((
    info: EventSourceFuncInfo,
    successCallback: (eventInputs: EventInput[] | unknown) => void,
    failureCallback: (error: Error) => void,
  ) => void) |
  ((info: EventSourceFuncInfo) => Promise<EventInput[] | unknown>)

let eventSourceDef: EventSourceDef<EventSourceFunc> = {

  parseMeta(refined) {
    if (typeof refined.events === 'function') {
      return refined.events
    }
    return null
  },

  fetch(arg, successCallback, errorCallback) {
    const { dateEnv } = arg.context
    const func = arg.eventSource.meta

    unpromisify(
      func.bind(null, buildRangeApiWithTimeZone(arg.range, dateEnv)),
      // may be any response, which eventSourceSuccess or the source's `success` turns into EventInput[]
      (rawEvents) => successCallback({ rawEvents: rawEvents as EventInput[] }),
      errorCallback,
    )
  },

}

export const funcEventSourcePlugin = {
  name: 'func-event-source',
  eventSourceDefs: [eventSourceDef],
} as PluginInput
