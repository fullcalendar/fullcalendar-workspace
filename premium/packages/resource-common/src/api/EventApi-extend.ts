import { EventApi } from '@fullcalendar/common'
import { ResourceApi } from './ResourceApi'

EventApi.prototype.getResources = function (this: EventApi): ResourceApi[] { // eslint-disable-line func-names
  let { calendarApi } = this._context

  return this._def.resourceIds.map((resourceId) => calendarApi.getResourceById(resourceId))
}

EventApi.prototype.setResources = function ( // eslint-disable-line func-names
  this: EventApi,
  resources: (string | ResourceApi)[],
) {
  let resourceIds = []

  // massage resources -> resourceIds
  for (let resource of resources) {
    let resourceId = null

    if (typeof resource === 'string') {
      resourceId = resource
    } else if (typeof resource === 'number') {
      resourceId = String(resource)
    } else if (resource instanceof ResourceApi) {
      resourceId = resource.id // guaranteed to always have an ID. hmmm
    } else {
      console.warn('unknown resource type: ' + resource)
    }

    if (resourceId) {
      resourceIds.push(resourceId)
    }
  }

  this.mutate({
    standardProps: {
      resourceIds,
    },
  })
}
