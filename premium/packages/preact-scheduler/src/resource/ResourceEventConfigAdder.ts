import {
  ViewProps, ViewPropsTransformer, CalendarContentProps, memoize, mapHash,
  EventUi, isPropsEqualShallow, EventUiHash, EventDefHash, EventDef, combineEventUis,
} from '@fullcalendar/preact/protected-api'
import { ResourceHash } from './structs/resource'

// for when non-resource view should be given EventUi info (for event coloring/constraints based off of resource data)

export class ResourceEventConfigAdder implements ViewPropsTransformer {
  buildResourceEventUis = memoize(buildResourceEventUis, isPropsEqualShallow)
  injectResourceEventUis = memoize(injectResourceEventUis)

  transform(viewProps: ViewProps, calendarProps: CalendarContentProps) {
    if (!calendarProps.viewSpec.optionDefaults.needsResourceData) {
      return {
        eventUiBases: this.injectResourceEventUis(
          viewProps.eventUiBases,
          viewProps.eventStore.defs,
          this.buildResourceEventUis(calendarProps.resourceStore),
        ),
      }
    }
    return null
  }
}

function buildResourceEventUis(resourceStore: ResourceHash) {
  return mapHash(resourceStore, (resource) => resource.ui)
}

/*
Goes by the events, not by eventUiBases' entries, since an event without a source has no entry
*/
function injectResourceEventUis(eventUiBases: EventUiHash, eventDefs: EventDefHash, resourceEventUis: EventUiHash) {
  let newEventUiBases: EventUiHash = { ...eventUiBases }

  for (let defId in eventDefs) {
    let eventDef = eventDefs[defId]

    if (eventDef.resourceIds.length) {
      newEventUiBases[defId] = injectResourceEventUi(eventUiBases[defId], eventDef, resourceEventUis)
    }
  }

  return newEventUiBases
}

function injectResourceEventUi(origEventUi: EventUi | undefined, eventDef: EventDef, resourceEventUis: EventUiHash) {
  let parts = []

  // first resource takes precedence, which fights with the ordering of combineEventUis, thus the unshifts
  for (let resourceId of eventDef.resourceIds) {
    if (resourceEventUis[resourceId]) {
      parts.unshift(resourceEventUis[resourceId])
    }
  }

  if (origEventUi) {
    parts.unshift(origEventUi)
  }

  return combineEventUis(parts)
}
