import { registerResourceSourceDef, ExtendedResourceSourceInput } from '../structs/resource-source'
import { ResourceInput } from '../structs/resource'

registerResourceSourceDef({

  ignoreRange: true,

  parseMeta(raw: ExtendedResourceSourceInput): ResourceInput[] | null {
    if (Array.isArray(raw)) {
      return raw
    } else if (Array.isArray(raw.resources)) {
      return raw.resources
    }

    return null
  },

  fetch(arg, successCallback) {
    successCallback({
      rawResources: arg.resourceSource.meta
    })
  }

})
