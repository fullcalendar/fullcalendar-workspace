import {
  ViewProps, ViewPropsTransformer, CalendarContentProps, memoize, mapHash,
  EventUi, isPropsEqualShallow, EventUiBases, EventUiHash, EventDef, combineEventUis,
} from '@fullcalendar/preact/protected-api'
import { ResourceHash } from './structs/resource'

/*
For views without resources: each event gets its resources' UI (coloring, constraints, etc.).
Views with resources get a resource's UI per section instead, from the splitter.
*/
export class ResourceEventConfigAdder implements ViewPropsTransformer {
  buildResourceEventUis = memoize(buildResourceEventUis, isPropsEqualShallow)
  buildGetResourcesEventUi = memoize(buildGetResourcesEventUi) // changes only when a resource's UI does
  addGetExtraUi = memoize(addGetExtraUi)

  transform(viewProps: ViewProps, calendarProps: CalendarContentProps) {
    if (!calendarProps.viewSpec.optionDefaults.needsResourceData) {
      return {
        eventUiBases: this.addGetExtraUi(
          viewProps.eventUiBases,
          this.buildGetResourcesEventUi(this.buildResourceEventUis(calendarProps.resourceStore)),
        ),
      }
    }
    return null
  }
}

function buildResourceEventUis(resourceStore: ResourceHash): EventUiHash {
  return mapHash(resourceStore, (resource) => resource.ui)
}

function buildGetResourcesEventUi(resourceEventUis: EventUiHash) {
  return (eventDef: EventDef): EventUi | undefined => {
    let { resourceIds } = eventDef

    if (resourceIds.length === 1) {
      return resourceEventUis[resourceIds[0]]
    }

    let parts: EventUi[] = []

    // first resource takes precedence, which fights with the ordering of combineEventUis, thus the unshifts
    for (let resourceId of resourceIds) {
      if (resourceEventUis[resourceId]) {
        parts.unshift(resourceEventUis[resourceId])
      }
    }

    return parts.length ? combineEventUis(parts) : undefined
  }
}

function addGetExtraUi(
  eventUiBases: EventUiBases,
  getExtraUi: (eventDef: EventDef) => EventUi | undefined,
): EventUiBases {
  return { ...eventUiBases, getExtraUi }
}
