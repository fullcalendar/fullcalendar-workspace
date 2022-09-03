import {
  ViewProps, ViewPropsTransformer, CalendarContentProps, memoize, mapHash,
  EventUi, isPropsEqual, EventUiHash, EventDefHash, EventDef, combineEventUis,
} from '@fullcalendar/common'
import { __assign } from 'tslib'
import { ResourceHash } from './structs/resource'

// for when non-resource view should be given EventUi info (for event coloring/constraints based off of resource data)

export class ResourceEventConfigAdder implements ViewPropsTransformer {
  buildResourceEventUis = memoize(buildResourceEventUis, isPropsEqual)
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

function injectResourceEventUis(eventUiBases: EventUiHash, eventDefs: EventDefHash, resourceEventUis: EventUiHash) {
  return mapHash(eventUiBases, (eventUi, defId) => {
    if (defId) { // not the '' key
      return injectResourceEventUi(eventUi, eventDefs[defId], resourceEventUis)
    }
    return eventUi
  })
}

function injectResourceEventUi(origEventUi: EventUi, eventDef: EventDef, resourceEventUis: EventUiHash) {
  let parts = []

  // first resource takes precedence, which fights with the ordering of combineEventUis, thus the unshifts
  for (let resourceId of eventDef.resourceIds) {
    if (resourceEventUis[resourceId]) {
      parts.unshift(resourceEventUis[resourceId])
    }
  }

  parts.unshift(origEventUi)

  return combineEventUis(parts)
}
