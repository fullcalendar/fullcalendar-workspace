import {
  ViewProps, ViewPropsTransformer, CalendarContentProps, EventStore, memoize, mapHash,
  EventUi, isPropsEqualShallow, EventUiHash, EventDefHash, EventDef, combineEventUis,
} from '@fullcalendar/preact/protected-api'
import { ResourceHash } from './resource'
import { ResourceEntityExpansions } from './store/reducers/resource-entity-expansions'

// for when resource views need resource data

export interface ResourceViewProps extends ViewProps {
  resourceStore: ResourceHash
  rawEventStore: EventStore // unlike ViewProps.eventStore, has no interaction-mirror substitutions
  resourceEntityExpansions: ResourceEntityExpansions
}

/*
Passes resource data through untouched. filterResourcesWithEvents is applied by each view
via resource/resource-filtering, so a view's whole visibility policy — view-wide and,
for the vertical views, per-date — lives in one place instead of straddling this transformer.
Views filter against rawEventStore so resources don't vanish while an event is being dragged.

CONSEQUENCE: declaring `needsResourceData` no longer buys a view filtering for free. A new
resource view must call filterResourceStore itself or filterResourcesWithEvents silently
does nothing for it.
*/
export class ResourceDataAdder implements ViewPropsTransformer {
  transform(viewProps: ViewProps, calendarProps: CalendarContentProps) {
    if (calendarProps.viewSpec.optionDefaults.needsResourceData) {
      return {
        resourceStore: calendarProps.resourceStore,
        rawEventStore: calendarProps.eventStore,
        resourceEntityExpansions: calendarProps.resourceEntityExpansions,
      }
    }
    return null
  }
}

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
