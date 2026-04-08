import { unpromisify } from '@fullcalendar/preact/protected-api'
import { ResourceSourceDef } from '../structs/resource-source-def'
import { ResourceInput } from '../structs/resource'
import { ResourceSourceRefined } from '../structs/resource-source-parse'

export interface ResourceFuncInfo {
  start?: Date
  end?: Date
  startStr?: string
  endStr?: string
  timeZone?: string
}

export type ResourceFunc =
  ((
    info: ResourceFuncInfo,
    successCallback: (resourceInputs: ResourceInput[]) => void,
    failureCallback: (error: Error) => void,
  ) => void) |
  ((info: ResourceFuncInfo) => Promise<ResourceInput[]>)

export const funcResourceSource: ResourceSourceDef<ResourceFunc> = {

  parseMeta(refined: ResourceSourceRefined) {
    if (typeof refined.resources === 'function') {
      return refined.resources
    }
    return null
  },

  fetch(info, successCallback, errorCallback) {
    const dateEnv = info.context.dateEnv
    const func = info.resourceSource.meta

    const publicData: ResourceFuncInfo = info.range ? {
      start: dateEnv.toDate(info.range.start),
      end: dateEnv.toDate(info.range.end),
      startStr: dateEnv.formatIso(info.range.start),
      endStr: dateEnv.formatIso(info.range.end),
      timeZone: dateEnv.timeZone,
    } : {}

    unpromisify(
      func.bind(null, publicData),
      (rawResources) => successCallback({ rawResources }),
      errorCallback,
    )
  },

}
