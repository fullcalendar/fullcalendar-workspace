import { DateSpan, CalendarApi, ReducerContext } from '@fullcalendar/common'
import { ResourceApi } from './ResourceApi'
import { ResourceInput, parseResource, ResourceHash, Resource } from '../structs/resource'


CalendarApi.prototype.addResource = function(this: CalendarApi, input: ResourceInput | ResourceApi, scrollTo = true) {
  let currentState = this.getCurrentState()
  let resourceHash: ResourceHash
  let resource: Resource

  if (input instanceof ResourceApi) {
    resource = input._resource
    resourceHash = { [resource.id]: resource }
  } else {
    resourceHash = {}
    resource = parseResource(input, '', resourceHash, currentState)
  }

  currentState.dispatch({ // TODO: use this.dispatch directly, but having problems with ResourceAction/Action
    type: 'ADD_RESOURCE',
    resourceHash
  })

  if (scrollTo) {
    this.emitter.trigger('_scrollRequest', { resourceId: resource.id })
  }

  return new ResourceApi(currentState, resource)
}


CalendarApi.prototype.getResourceById = function(this: CalendarApi, id: string) {
  id = String(id)
  let currentState = this.getCurrentState()

  if (currentState.resourceStore) { // guard against calendar with no resource functionality
    let rawResource = currentState.resourceStore[id]

    if (rawResource) {
      return new ResourceApi(currentState, rawResource)
    }
  }

  return null
}


CalendarApi.prototype.getResources = function(this: CalendarApi): ResourceApi[] {
  let currentState = this.getCurrentState()
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
  let currentState = this.getCurrentState()
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
  this.getCurrentState().dispatch({ // TODO: use this.dispatch directly, but having problems with ResourceAction/Action
    type: 'REFETCH_RESOURCES'
  })
}


export function transformDatePoint(dateSpan: DateSpan, context: ReducerContext) {
  return dateSpan.resourceId ?
    { resource: context.calendarApi.getResourceById(dateSpan.resourceId) } :
    {}
}


export function transformDateSpan(dateSpan: DateSpan, context: ReducerContext) {
  return dateSpan.resourceId ?
    { resource: context.calendarApi.getResourceById(dateSpan.resourceId) } :
    {}
}
