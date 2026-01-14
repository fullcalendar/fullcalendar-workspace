import { registerResourceSourceDef } from '../structs/resource-source-def'
import { ResourceInput } from '../structs/resource'
import { ResourceSourceRefined } from '../structs/resource-source-parse'

registerResourceSourceDef<ResourceInput[]>({

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

})
