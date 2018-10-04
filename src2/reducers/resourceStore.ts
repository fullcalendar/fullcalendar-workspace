import { ResourceAction } from './resources'
import { ResourceHash, ResourceInput, parseResource } from '../structs/resource'
import { ResourceSource } from '../structs/resource-source'

export default function(store: ResourceHash | undefined, action: ResourceAction, source: ResourceSource): ResourceHash {
  switch(action.type) {
    case 'INIT':
      return {}
    case 'RECEIVE_RESOURCES':
      return receiveRawResources(store, action.rawResources, action.fetchId, source)
    default:
      return store
  }
}

function receiveRawResources(existingStore: ResourceHash, inputs: ResourceInput[], fetchId: string, source: ResourceSource): ResourceHash {
  if (source.latestFetchId === fetchId) {
    let nextStore: ResourceHash = {}

    for (let input of inputs) {
      parseResource(input, '', nextStore)
    }

    return nextStore
  } else {
    return existingStore
  }
}
