import { EventInteractionUiState, EventStore, createEmptyEventStore } from 'fullcalendar'

export function splitEventInteraction(interaction: EventInteractionUiState): { [resourceId: string]: EventInteractionUiState } {
  if (!interaction) {
    return {}
  }

  let affectedStores = splitEventStores(interaction.affectedEvents)
  let mutatedStores = splitEventStores(interaction.mutatedEvents)
  let res: { [resourceId: string]: EventInteractionUiState } = {}

  function populate(resourceId) {
    if (!res[resourceId]) {
      res[resourceId] = {
        affectedEvents: affectedStores[resourceId] || {},
        mutatedEvents: mutatedStores[resourceId] || {},
        eventUis: interaction.eventUis,
        isEvent: interaction.isEvent,
        origSeg: interaction.origSeg
      }
    }
  }

  for (let resourceId in affectedStores) {
    populate(resourceId)
  }

  for (let resourceId in mutatedStores) {
    populate(resourceId)
  }

  return res
}

export function splitEventStores(eventStore: EventStore) {
  let { defs, instances } = eventStore
  let eventStoresByResourceId = {}

  for (let defId in defs) {
    let def = defs[defId]
    let resourceIds = def.resourceIds

    if (!resourceIds.length) { // TODO: more DRY
      resourceIds = [ '' ]
    }

    for (let resourceId of resourceIds) {
      (eventStoresByResourceId[resourceId] ||
        (eventStoresByResourceId[resourceId] = createEmptyEventStore())
      ).defs[defId] = def
    }
  }

  for (let instanceId in instances) {
    let instance = instances[instanceId]
    let def = defs[instance.defId]
    let resourceIds = def.resourceIds

    if (!resourceIds.length) { // TODO: more DRY
      resourceIds = [ '' ]
    }

    for (let resourceId of resourceIds) {
      eventStoresByResourceId[resourceId]
        .instances[instanceId] = instance
    }
  }

  return eventStoresByResourceId
}
