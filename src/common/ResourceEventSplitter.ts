import { Splitter, EventDef, EventUiHash, combineEventUis, EventStore, EventUi } from 'fullcalendar'

export default class ResourceEventSplitter extends Splitter {

  getKeysForEventDef(eventDef: EventDef): string[] {
    let resourceIds = eventDef.resourceIds

    if (!resourceIds.length) {
      if (this.ensuredKeys.length) {
        resourceIds = this.ensuredKeys
      } else {
        resourceIds = [ '' ]
      }
    }

    return resourceIds
  }

}

// TODO: make sure to update places where memoization happens!
export function splitEventUiBases(
  eventUiBases: EventUiHash,
  eventUiByResource: { [resourceId: string]: EventUi },
  eventStores: { [resourceId: string]: EventStore }
): { [resourceId: string]: EventUiHash } {
  let bases: { [resourceId: string]: EventUiHash } = {}

  let processResourceId = function(resourceId: string) {
    let partsForSingle = []

    if (eventUiBases['']) {
      partsForSingle.push(eventUiBases[''])
    }

    if (eventUiByResource[resourceId]) {
      partsForSingle.push(eventUiByResource[resourceId])
    }

    let segmentUis = {
      '': combineEventUis(partsForSingle)
    }

    if (eventStores[resourceId]) {
      let { defs } = eventStores[resourceId]

      for (let defId in defs) {
        segmentUis[defId] = eventUiBases[defId]
      }
    }

    bases[resourceId] = segmentUis
  }

  processResourceId('')

  for (let resourceId in eventUiByResource) {
    processResourceId(resourceId)
  }

  return bases
}
