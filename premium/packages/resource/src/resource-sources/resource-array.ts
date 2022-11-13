import { registerResourceSourceDef } from '../structs/resource-source-def.js'
import { ResourceInput } from '../structs/resource.js'
import { ResourceSourceRefined } from '../structs/resource-source-parse.js'

registerResourceSourceDef<ResourceInput[]>({

  ignoreRange: true,

  parseMeta(refined: ResourceSourceRefined) {
    if (Array.isArray(refined.resources)) {
      return refined.resources
    }
    return null
  },

  fetch(arg) {
    return Promise.resolve({
      rawResources: arg.resourceSource.meta,
    })
  },

})
