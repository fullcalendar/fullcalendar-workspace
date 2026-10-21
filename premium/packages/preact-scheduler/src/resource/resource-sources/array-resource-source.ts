import { ResourceInput } from '../resource'
import { ResourceSourceDef } from './resource-source-def'
import { ResourceSourceRefined } from './resource-source-parse'

export const arrayResourceSource: ResourceSourceDef<ResourceInput[]> = {

  ignoreRange: true,

  parseMeta(refined: ResourceSourceRefined) {
    if (Array.isArray(refined.resources)) {
      return refined.resources
    }
    return null
  },

  fetch(arg, successCallback) {
    successCallback({
      rawResources: arg.resourceSource.meta,
    })
  },

}
