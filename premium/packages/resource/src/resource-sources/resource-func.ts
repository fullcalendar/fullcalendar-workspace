import { unpromisify } from '@fullcalendar/core/internal'
import { registerResourceSourceDef } from '../structs/resource-source-def.js'
import { ResourceInput } from '../structs/resource.js'
import { ResourceSourceRefined } from '../structs/resource-source-parse.js'

export interface ResourceFuncArg {
  start?: Date
  end?: Date
  startStr?: string
  endStr?: string
  timeZone?: string
}

export type ResourceFunc =
  ((arg: ResourceFuncArg, callback: (resourceInputs: ResourceInput[]) => void) => void) |
  ((arg: ResourceFuncArg) => Promise<ResourceInput[]>)

registerResourceSourceDef<ResourceFunc>({

  parseMeta(refined: ResourceSourceRefined) {
    if (typeof refined.resources === 'function') {
      return refined.resources
    }
    return null
  },

  fetch(arg, successCallback, errorCallback) {
    const dateEnv = arg.context.dateEnv
    const func = arg.resourceSource.meta

    const publicArg: ResourceFuncArg = arg.range ? {
      start: dateEnv.toDate(arg.range.start),
      end: dateEnv.toDate(arg.range.end),
      startStr: dateEnv.formatIso(arg.range.start),
      endStr: dateEnv.formatIso(arg.range.end),
      timeZone: dateEnv.timeZone,
    } : {}

    unpromisify(
      func.bind(null, publicArg),
      (rawResources) => successCallback({ rawResources }),
      errorCallback,
    )
  },

})
