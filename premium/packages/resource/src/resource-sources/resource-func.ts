import { unpromisify } from '@fullcalendar/core/internal'
import { registerResourceSourceDef } from '../structs/resource-source-def.js'
import { ResourceInput } from '../structs/resource.js'
import { ResourceSourceRefined } from '../structs/resource-source-parse.js'

export interface ResourceFuncData {
  start?: Date
  end?: Date
  startStr?: string
  endStr?: string
  timeZone?: string
}

export type ResourceFunc =
  ((
    data: ResourceFuncData,
    successCallback: (resourceInputs: ResourceInput[]) => void,
    failureCallback: (error: Error) => void,
  ) => void) |
  ((data: ResourceFuncData) => Promise<ResourceInput[]>)

registerResourceSourceDef<ResourceFunc>({

  parseMeta(refined: ResourceSourceRefined) {
    if (typeof refined.resources === 'function') {
      return refined.resources
    }
    return null
  },

  fetch(data, successCallback, errorCallback) {
    const dateEnv = data.context.dateEnv
    const func = data.resourceSource.meta

    const publicData: ResourceFuncData = data.range ? {
      start: dateEnv.toDate(data.range.start),
      end: dateEnv.toDate(data.range.end),
      startStr: dateEnv.formatIso(data.range.start),
      endStr: dateEnv.formatIso(data.range.end),
      timeZone: dateEnv.timeZone,
    } : {}

    unpromisify(
      func.bind(null, publicData),
      (rawResources) => successCallback({ rawResources }),
      errorCallback,
    )
  },

})
