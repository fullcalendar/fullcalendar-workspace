import { Calendar } from 'fullcalendar'
import { ResourceAction } from './resources'
import { ResourceHash, ResourceInput, parseResource } from '../structs/resource'
import { ResourceSource } from '../structs/resource-source'

export default function(store: ResourceHash | undefined, action: ResourceAction, source: ResourceSource, calendar: Calendar): ResourceHash {
  switch(action.type) {
    case 'INIT':
      return {}
    case 'RECEIVE_RESOURCES':
      return receiveRawResources(store, action.rawResources, action.fetchId, source, calendar)
    default:
      return store
  }
}

function receiveRawResources(existingStore: ResourceHash, inputs: ResourceInput[], fetchId: string, source: ResourceSource, calendar: Calendar): ResourceHash {
  if (source.latestFetchId === fetchId) {
    let nextStore: ResourceHash = {}

    for (let input of inputs) {
      parseResource(input, '', nextStore, calendar)
    }

    return nextStore
  } else {
    return existingStore
  }
}
