import { DateSpan, CalendarApi, CalendarContext } from '@fullcalendar/common'
import { ResourceApi } from './ResourceApi'
import { ResourceInput, parseResource, ResourceHash, Resource } from '../structs/resource'


CalendarApi.prototype.addResource = function(this: CalendarApi, input: ResourceInput | ResourceApi, scrollTo = true) {
  let currentState = this.getCurrentData()
  let resourceHash: ResourceHash
  let resource: Resource

  if (input instanceof ResourceApi) {
    resource = input._resource
    resourceHash = { [resource.id]: resource }
  } else {
    resourceHash = {}
    resource = parseResource(input, '', resourceHash, currentState)
  }

  this.dispatch({
    type: 'ADD_RESOURCE',
    resourceHash
  })

  if (scrollTo) {
    this.trigger('_scrollRequest', { resourceId: resource.id })
  }

  return new ResourceApi(currentState, resource)
}


CalendarApi.prototype.getResourceById = function(this: CalendarApi, id: string) {
  id = String(id)
  let currentState = this.getCurrentData()

  if (currentState.resourceStore) { // guard against calendar with no resource functionality
    let rawResource = currentState.resourceStore[id]

    if (rawResource) {
      return new ResourceApi(currentState, rawResource)
    }
  }

  return null
}


CalendarApi.prototype.getResources = function(this: CalendarApi): ResourceApi[] {
  let currentState = this.getCurrentData()
  let { resourceStore } = currentState
  let resourceApis: ResourceApi[] = []

  if (resourceStore) { // guard against calendar with no resource functionality
    for (let resourceId in resourceStore) {
      resourceApis.push(
        new ResourceApi(currentState, resourceStore[resourceId])
      )
    }
  }

  return resourceApis
}


CalendarApi.prototype.getTopLevelResources = function(this: CalendarApi): ResourceApi[] {
  let currentState = this.getCurrentData()
  let { resourceStore } = currentState
  let resourceApis: ResourceApi[] = []

  if (resourceStore) { // guard against calendar with no resource functionality
    for (let resourceId in resourceStore) {
      if (!resourceStore[resourceId].parentId) {
        resourceApis.push(
          new ResourceApi(currentState, resourceStore[resourceId])
        )
      }
    }
  }

  return resourceApis
}


CalendarApi.prototype.refetchResources = function(this: CalendarApi) {
  this.dispatch({
    type: 'REFETCH_RESOURCES'
  })
}


export function transformDatePoint(dateSpan: DateSpan, context: CalendarContext) {
  return dateSpan.resourceId ?
    { resource: context.calendarApi.getResourceById(dateSpan.resourceId) } :
    {}
}


export function transformDateSpan(dateSpan: DateSpan, context: CalendarContext) {
  return dateSpan.resourceId ?
    { resource: context.calendarApi.getResourceById(dateSpan.resourceId) } :
    {}
}
