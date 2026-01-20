import { ResourceInput } from '../structs/resource'
import { ResourceSourceDef } from '../structs/resource-source-def'
import { ResourceSourceRefined } from '../structs/resource-source-parse'

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
