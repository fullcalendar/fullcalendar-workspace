import { unpromisify } from '@fullcalendar/core'
import { registerResourceSourceDef, ExtendedResourceSourceInput, ResourceSourceError } from '../structs/resource-source'
import { ResourceInput } from '../structs/resource'

export type ResourceFunc = (
  arg: {
    start: Date
    end: Date
    timeZone: string
  },
  successCallback: (events: ResourceInput[]) => void,
  failureCallback: (errorObj: ResourceSourceError) => void
) => any // TODO: promise-like object or nothing

registerResourceSourceDef({

  parseMeta(raw: ExtendedResourceSourceInput): ResourceInput[] | null {
    if (typeof raw === 'function') {
      return raw
    } else if (typeof raw.resources === 'function') {
      return raw.resources
    }

    return null
  },

  fetch(arg, success, failure) {
    let dateEnv = arg.calendar.dateEnv
    let func = arg.resourceSource.meta as ResourceFunc

    let publicArg = {}
    if (arg.range) {
      publicArg = {
        start: dateEnv.toDate(arg.range.start),
        end: dateEnv.toDate(arg.range.end),
        startStr: dateEnv.formatIso(arg.range.start),
        endStr: dateEnv.formatIso(arg.range.end),
        timeZone: dateEnv.timeZone
      }
    }

    // TODO: make more dry with EventSourceFunc
    // TODO: accept a response?
    unpromisify(
      func.bind(null, publicArg),
      function(rawResources) { // success
        success({ rawResources }) // needs an object response
      },
      failure // send errorObj directly to failure callback
    )
  }

})
