import { CalendarContext } from '@fullcalendar/common'
import { ResourceAction } from './resource-action'
import { ResourceHash, ResourceInput, parseResource } from '../structs/resource'
import { ResourceSource } from '../structs/resource-source'

export function reduceResourceStore(
  store: ResourceHash | null,
  action: ResourceAction | null,
  source: ResourceSource<any>,
  context: CalendarContext,
): ResourceHash {
  if (!store || !action) {
    return {}
  }

  switch (action.type) {
    case 'RECEIVE_RESOURCES':
      return receiveRawResources(store, action.rawResources, action.fetchId, source, context)

    case 'ADD_RESOURCE':
      return addResource(store, action.resourceHash)

    case 'REMOVE_RESOURCE':
      return removeResource(store, action.resourceId)

    case 'SET_RESOURCE_PROP':
      return setResourceProp(store, action.resourceId, action.propName, action.propValue)

    case 'SET_RESOURCE_EXTENDED_PROP':
      return setResourceExtendedProp(store, action.resourceId, action.propName, action.propValue)

    default:
      return store
  }
}

function receiveRawResources(
  existingStore: ResourceHash,
  inputs: ResourceInput[],
  fetchId: string,
  source: ResourceSource<any>,
  context: CalendarContext,
): ResourceHash {
  if (source.latestFetchId === fetchId) {
    let nextStore: ResourceHash = {}

    for (let input of inputs) {
      parseResource(input, '', nextStore, context)
    }

    return nextStore
  }

  return existingStore
}

function addResource(existingStore: ResourceHash, additions: ResourceHash) {
  // TODO: warn about duplicate IDs

  return { ...existingStore, ...additions }
}

function removeResource(existingStore: ResourceHash, resourceId: string) {
  let newStore = { ...existingStore } as ResourceHash

  delete newStore[resourceId]

  // promote children
  for (let childResourceId in newStore) { // a child, *maybe* but probably not
    if (newStore[childResourceId].parentId === resourceId) {
      newStore[childResourceId] = {
        ...newStore[childResourceId],
        parentId: '',
      }
    }
  }

  return newStore
}

function setResourceProp(existingStore: ResourceHash, resourceId: string, name: string, value: any): ResourceHash {
  let existingResource = existingStore[resourceId]

  // TODO: sanitization

  if (existingResource) {
    return {
      ...existingStore,
      [resourceId]: {
        ...existingResource,
        [name]: value,
      },
    }
  }

  return existingStore
}

function setResourceExtendedProp(existingStore: ResourceHash, resourceId: string, name: string, value: any): ResourceHash {
  let existingResource = existingStore[resourceId]

  if (existingResource) {
    return {
      ...existingStore,
      [resourceId]: {
        ...existingResource,
        extendedProps: {
          ...existingResource.extendedProps,
          [name]: value,
        },
      },
    }
  }

  return existingStore
}
