import { ViewProps, ViewSpec, ViewPropsTransformer, CalendarComponentProps, memoize, mapHash, EventUi, isPropsEqual, memoizeOutput, EventUiHash, EventDefHash, EventDef, combineEventUis } from 'fullcalendar'
import { ResourceHash } from './structs/resource'
import { ResourceEntityExpansions } from './reducers/resourceEntityExpansions'


// for when resource views need resource data

export interface ResourceViewProps extends ViewProps {
  resourceStore: ResourceHash
  resourceEntityExpansions: ResourceEntityExpansions
}

export class ResourceDataAdder implements ViewPropsTransformer {

  transform(viewProps: ViewProps, viewSpec: ViewSpec, calendarProps: CalendarComponentProps) {
    if ((viewSpec.class as any).needsResourceData) {
      return {
        resourceStore: calendarProps.resourceStore,
        resourceEntityExpansions: calendarProps.resourceEntityExpansions
      }
    }
  }

}


// for when non-resource view should be given EventUi info (for event coloring/constraints based off of resource data)

export class ResourceEventConfigAdder implements ViewPropsTransformer {

  buildResourceEventUis = memoizeOutput(buildResourceEventUis, isPropsEqual)
  injectResourceEventUis = memoize(injectResourceEventUis)

  transform(viewProps: ViewProps, viewSpec: ViewSpec, calendarProps: CalendarComponentProps) {
    if (!(viewSpec.class as any).needsResourceData) { // is a non-resource view?
      return {
        eventUiBases: this.injectResourceEventUis(
          viewProps.eventUiBases,
          viewProps.eventStore.defs,
          this.buildResourceEventUis(calendarProps.resourceStore)
        )
      }
    }
  }

}

function buildResourceEventUis(resourceStore: ResourceHash) {
  return mapHash(resourceStore, function(resource) {
    return resource.ui
  })
}

function injectResourceEventUis(eventUiBases: EventUiHash, eventDefs: EventDefHash, resourceEventUis: EventUiHash) {
  return mapHash(eventUiBases, function(eventUi, defId) {
    if (defId) { // not the '' key
      return injectResourceEventUi(eventUi, eventDefs[defId], resourceEventUis)
    } else {
      return eventUi
    }
  })
}

function injectResourceEventUi(origEventUi: EventUi, eventDef: EventDef, resourceEventUis: EventUiHash) {
  let parts = [ origEventUi ]

  for (let resourceId of eventDef.resourceIds) {
    if (resourceEventUis[resourceId]) {
      parts.push(resourceEventUis[resourceId])
    }
  }

  return combineEventUis(parts)
}
