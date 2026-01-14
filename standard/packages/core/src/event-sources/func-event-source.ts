import { EventSourceDef } from '../structs/event-source-def'
import { EventInput } from '../structs/event-parse'
import { createPlugin } from '../plugin-system'
import { buildRangeApiWithTimeZone } from '../structs/date-span'
import { unpromisify } from '../util/promise'

export type EventSourceFuncData = {
  start: Date
  end: Date
  startStr: string
  endStr: string
  timeZone: string
}

export type EventSourceFunc =
  ((
    data: EventSourceFuncData,
    successCallback: (eventInputs: EventInput[]) => void,
    failureCallback: (error: Error) => void,
  ) => void) |
  ((data: EventSourceFuncData) => Promise<EventInput[]>)

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
      (rawEvents) => successCallback({ rawEvents }),
      errorCallback,
    )
  },

}

export const funcEventSourcePlugin = createPlugin({
  name: 'func-event-source',
  eventSourceDefs: [eventSourceDef],
})
