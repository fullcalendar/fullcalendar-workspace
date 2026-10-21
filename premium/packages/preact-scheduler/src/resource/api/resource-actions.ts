import { CalendarApiImpl, CalendarStore } from '@fullcalendar/preact/protected-api'
import { ResourceApi } from './ResourceApi'
import { ResourceInput, parseResource, ResourceHash, Resource } from '../structs/resource'

/*
The resource plugin's actions, merged into store.actions (the calendarActions hook), with what were the
CalendarApiImpl patches' and ResourceApi's mutation bodies. See planning/phase-9-store.md
*/
export interface ResourceActions {
  addResource(input: ResourceInput | ResourceApi, scrollTo?: boolean): ResourceApi
  refetchResources(): void
  // ResourceApi's mutations. update the given wrapper to the changed resource, as ResourceApi did
  setResourceProp(resourceApi: ResourceApi, name: string, value: any): void
  setResourceExtendedProp(resourceApi: ResourceApi, name: string, value: any): void
  removeResource(resourceApi: ResourceApi): void
}

export function createResourceActions(store: CalendarStore, _calendarApi: CalendarApiImpl): ResourceActions {
  const dispatch = store.dispatch as (action: any) => void
  const getCurrentData = () => store.getData()

  // after a prop change: the wrapper gets the new resource, then resourceChange
  function syncResource(resourceApi: ResourceApi, oldResource: Resource) {
    let context = resourceApi._context
    let resourceId = oldResource.id

    // TODO: what if dispatch didn't complete synchronously?
    resourceApi._resource = context.getCurrentData().resourceStore[resourceId]

    context.emitter.trigger('resourceChange', {
      oldResource: new ResourceApi(context, oldResource),
      resource: resourceApi,
      revert() {
        context.dispatch({
          type: 'ADD_RESOURCE', // function as a merge. TODO: rename
          resourceHash: {
            [resourceId]: oldResource,
          },
        })
      },
    })
  }

  return {
    addResource(input, scrollTo = true) {
      let currentState = getCurrentData()
      let resourceHash: ResourceHash
      let resource: Resource

      if (input instanceof ResourceApi) {
        resource = input._resource
        resourceHash = { [resource.id]: resource }
      } else {
        resourceHash = {}
        resource = parseResource(input, '', resourceHash, currentState)
      }

      dispatch({
        type: 'ADD_RESOURCE',
        resourceHash,
      })

      if (scrollTo) {
        // TODO: wait til dispatch completes somehow
        store.emitter.trigger('_resourceScrollRequest', resource.id)
      }

      let resourceApi = new ResourceApi(currentState, resource)

      currentState.emitter.trigger('resourceAdd', {
        resource: resourceApi,
        revert: () => {
          dispatch({
            type: 'REMOVE_RESOURCE',
            resourceId: resource.id,
          })
        },
      })

      return resourceApi
    },

    refetchResources() {
      dispatch({
        type: 'REFETCH_RESOURCES',
      })
    },

    setResourceProp(resourceApi, name, value) {
      let oldResource = resourceApi._resource

      resourceApi._context.dispatch({
        type: 'SET_RESOURCE_PROP',
        resourceId: oldResource.id,
        propName: name,
        propValue: value,
      })

      syncResource(resourceApi, oldResource)
    },

    setResourceExtendedProp(resourceApi, name, value) {
      let oldResource = resourceApi._resource

      resourceApi._context.dispatch({
        type: 'SET_RESOURCE_EXTENDED_PROP',
        resourceId: oldResource.id,
        propName: name,
        propValue: value,
      })

      syncResource(resourceApi, oldResource)
    },

    removeResource(resourceApi) {
      let context = resourceApi._context
      let internalResource = resourceApi._resource
      let resourceId = internalResource.id

      context.dispatch({
        type: 'REMOVE_RESOURCE',
        resourceId,
      })

      context.emitter.trigger('resourceRemove', {
        resource: resourceApi,
        revert() {
          context.dispatch({
            type: 'ADD_RESOURCE', // function as a merge. TODO: rename
            resourceHash: {
              [resourceId]: internalResource,
            },
          })
        },
      })
    },
  }
}

const RESOURCE_ACTION_NAMES: (keyof ResourceActions)[] = [
  'addResource', 'refetchResources', 'setResourceProp', 'setResourceExtendedProp', 'removeResource',
]

/*
The calendar's resource actions. The API patches and ResourceApi exist whenever this bundle is imported,
even for a calendar without the resource plugin, where they've always still run. So each action is the
registered one (the resource plugin's, or a plugin's that replaces it), or else the same one, unregistered
*/
export function getResourceActions(calendarApi: CalendarApiImpl): ResourceActions {
  const { store } = calendarApi
  const registered = store!.actions as Partial<ResourceActions>
  let fallback: ResourceActions | undefined
  let actions = {} as ResourceActions

  for (const name of RESOURCE_ACTION_NAMES) {
    if (registered[name]) {
      actions[name] = registered[name] as any
    } else {
      fallback = fallback || createResourceActions(store!, calendarApi)
      actions[name] = fallback[name] as any
    }
  }

  return actions
}
