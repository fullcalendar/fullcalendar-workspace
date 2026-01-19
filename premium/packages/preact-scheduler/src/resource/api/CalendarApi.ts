import { CalendarApiImpl, DateSpan, CalendarContext } from '@fullcalendar/preact/protected-api'
import { ResourceApi } from './ResourceApi'
import { ResourceInput, parseResource, ResourceHash, Resource } from '../structs/resource'
import { ResourceAction } from '../reducers/resource-action'

declare module '@fullcalendar/preact' {
  interface CalendarApi {
    addResource(input: ResourceInput, scrollTo?: boolean): ResourceApi
    getResourceById(id: string): ResourceApi | null
    getResources(): ResourceApi[]
    getTopLevelResources(): ResourceApi[]
    refetchResources(): void
  }
}

// TODO: more DRY
declare module '@fullcalendar/preact/protected-api' {
  interface CalendarApiImpl {
    dispatch(action: ResourceAction) // internal-only
    addResource(input: ResourceInput, scrollTo?: boolean): ResourceApi
    getResourceById(id: string): ResourceApi | null
    getResources(): ResourceApi[]
    getTopLevelResources(): ResourceApi[]
    refetchResources(): void
  }
}

CalendarApiImpl.prototype.addResource = function ( // eslint-disable-line func-names
  this: CalendarApiImpl,
  input: ResourceInput | ResourceApi,
  scrollTo = true,
) {
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
    resourceHash,
  })

  if (scrollTo) {
    // TODO: wait til dispatch completes somehow
    this.trigger('_resourceScrollRequest', resource.id)
  }

  let resourceApi = new ResourceApi(currentState, resource)

  currentState.emitter.trigger('resourceAdd', {
    resource: resourceApi,
    revert: () => {
      this.dispatch({
        type: 'REMOVE_RESOURCE',
        resourceId: resource.id,
      })
    },
  })

  return resourceApi
}

CalendarApiImpl.prototype.getResourceById = function (this: CalendarApiImpl, id: string) { // eslint-disable-line func-names
  id = String(id)
  let currentState = this.getCurrentData() // eslint-disable-line react/no-this-in-sfc

  if (currentState.resourceStore) { // guard against calendar with no resource functionality
    let rawResource = currentState.resourceStore[id]

    if (rawResource) {
      return new ResourceApi(currentState, rawResource)
    }
  }

  return null
}

CalendarApiImpl.prototype.getResources = function (this: CalendarApiImpl): ResourceApi[] { // eslint-disable-line func-names
  let currentState = this.getCurrentData()
  let { resourceStore } = currentState
  let resourceApis: ResourceApi[] = []

  if (resourceStore) { // guard against calendar with no resource functionality
    for (let resourceId in resourceStore) {
      resourceApis.push(
        new ResourceApi(currentState, resourceStore[resourceId]),
      )
    }
  }

  return resourceApis
}

CalendarApiImpl.prototype.getTopLevelResources = function (this: CalendarApiImpl): ResourceApi[] { // eslint-disable-line func-names
  let currentState = this.getCurrentData()
  let { resourceStore } = currentState
  let resourceApis: ResourceApi[] = []

  if (resourceStore) { // guard against calendar with no resource functionality
    for (let resourceId in resourceStore) {
      if (!resourceStore[resourceId].parentId) {
        resourceApis.push(
          new ResourceApi(currentState, resourceStore[resourceId]),
        )
      }
    }
  }

  return resourceApis
}

CalendarApiImpl.prototype.refetchResources = function (this: CalendarApiImpl) { // eslint-disable-line func-names
  this.dispatch({
    type: 'REFETCH_RESOURCES',
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
