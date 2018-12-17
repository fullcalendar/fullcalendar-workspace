import { Resource, getPublicId } from '../structs/resource'
import ResourceApi from '../api/ResourceApi'

export function buildResourceTextFunc(resourceTextSetting, calendar) {
  if (typeof resourceTextSetting === 'function') {
    return function(resource: Resource) {
      return resourceTextSetting(new ResourceApi(calendar, resource))
    }
  } else {
    return function(resource: Resource) {
      return resource.title || getPublicId(resource.id)
    }
  }
}
