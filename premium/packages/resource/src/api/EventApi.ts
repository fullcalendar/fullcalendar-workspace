import { EventImpl } from '@fullcalendar/core/internal'
import { ResourceApi } from './ResourceApi.js'
import { EVENT_REFINERS } from '../structs/event-parse.js'

declare module '@fullcalendar/core' {
  interface EventApi {
    getResources: () => ResourceApi[]
    setResources: (resources: (string | ResourceApi)[]) => void
  }
}

// TODO: more DRY
declare module '@fullcalendar/core/internal' {
  interface EventImpl {
    getResources: () => ResourceApi[]
    setResources: (resources: (string | ResourceApi)[]) => void
  }
}

EventImpl.prototype.getResources = function (this: EventImpl): ResourceApi[] { // eslint-disable-line func-names
  let { calendarApi } = this._context

  return this._def.resourceIds.map((resourceId) => calendarApi.getResourceById(resourceId))
}

EventImpl.prototype.setResources = function ( // eslint-disable-line func-names
  this: EventImpl,
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

// core's setProp doesn't know about the scheduler's event props (#5166)
const origSetProp = EventImpl.prototype.setProp

EventImpl.prototype.setProp = function ( // eslint-disable-line func-names
  this: EventImpl,
  name: string,
  val: any,
) {
  if (name === 'resourceEditable') {
    this.mutate({
      standardProps: {
        resourceEditable: EVENT_REFINERS.resourceEditable(val),
      },
    })
  } else {
    origSetProp.call(this, name, val)
  }
}
