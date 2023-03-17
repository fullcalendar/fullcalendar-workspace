import { CalendarImpl, DateSpan, CalendarContext } from '@fullcalendar/core/internal'
import { ResourceApi } from './ResourceApi.js'
import { ResourceInput, parseResource, ResourceHash, Resource } from '../structs/resource.js'
import { ResourceAction } from '../reducers/resource-action.js'

declare module '@fullcalendar/core' {
  interface CalendarApi {
    addResource(input: ResourceInput, scrollTo?: boolean): ResourceApi
    getResourceById(id: string): ResourceApi | null
    getResources(): ResourceApi[]
    getTopLevelResources(): ResourceApi[]
    refetchResources(): void
  }
}

// TODO: more DRY
declare module '@fullcalendar/core/internal' {
  interface CalendarImpl {
    dispatch(action: ResourceAction) // internal-only
    addResource(input: ResourceInput, scrollTo?: boolean): ResourceApi
    getResourceById(id: string): ResourceApi | null
    getResources(): ResourceApi[]
    getTopLevelResources(): ResourceApi[]
    refetchResources(): void
  }
}

CalendarImpl.prototype.addResource = function ( // eslint-disable-line func-names
  this: CalendarImpl,
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
    this.trigger('_scrollRequest', { resourceId: resource.id })
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

CalendarImpl.prototype.getResourceById = function (this: CalendarImpl, id: string) { // eslint-disable-line func-names
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

CalendarImpl.prototype.getResources = function (this: CalendarImpl): ResourceApi[] { // eslint-disable-line func-names
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

CalendarImpl.prototype.getTopLevelResources = function (this: CalendarImpl): ResourceApi[] { // eslint-disable-line func-names
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

CalendarImpl.prototype.refetchResources = function (this: CalendarImpl) { // eslint-disable-line func-names
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
