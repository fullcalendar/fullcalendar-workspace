import { View, rangesIntersect, EventInstanceHash, filterHash, ViewProps, ViewSpec, ViewPropsTransformer, CalendarComponentProps, memoize, mapHash, EventUi, isPropsEqual, memoizeOutput, EventUiHash, EventDefHash, EventDef, combineEventUis, EventStore, DateRange } from '@fullcalendar/core'
import { ResourceHash } from './structs/resource'
import { ResourceEntityExpansions } from './reducers/resourceEntityExpansions'
import { __assign } from 'tslib'
import { computeResourceEditable } from './EventDragging'


// for when resource views need resource data

export interface ResourceViewProps extends ViewProps {
  resourceStore: ResourceHash
  resourceEntityExpansions: ResourceEntityExpansions
}

export class ResourceDataAdder implements ViewPropsTransformer {

  filterResources = memoize(filterResources)

  transform(viewProps: ViewProps, viewSpec: ViewSpec, calendarProps: CalendarComponentProps, allOptions: any) {
    if ((viewSpec.class as any).needsResourceData) {
      return {
        resourceStore: this.filterResources(
          calendarProps.resourceStore,
          allOptions.filterResourcesWithEvents,
          calendarProps.eventStore,
          calendarProps.dateProfile.activeRange
        ),
        resourceEntityExpansions: calendarProps.resourceEntityExpansions
      }
    }
  }

}

function filterResources(resourceStore: ResourceHash, doFilterResourcesWithEvents: boolean, eventStore: EventStore, activeRange: DateRange): ResourceHash {
  if (doFilterResourcesWithEvents) {
    let instancesInRange = filterEventInstancesInRange(eventStore.instances, activeRange)
    let hasEvents = computeHasEvents(instancesInRange, eventStore.defs)

    __assign(hasEvents, computeAncestorHasEvents(hasEvents, resourceStore))

    return filterHash(resourceStore, function(resource, resourceId) {
      return hasEvents[resourceId]
    })

  } else {
    return resourceStore
  }
}

function filterEventInstancesInRange(eventInstances: EventInstanceHash, activeRange: DateRange) {
  return filterHash(eventInstances, function(eventInstance) {
    return rangesIntersect(eventInstance.range, activeRange)
  })
}

function computeHasEvents(eventInstances: EventInstanceHash, eventDefs: EventDefHash) {
  let hasEvents = {}

  for (let instanceId in eventInstances) {
    let instance = eventInstances[instanceId]

    for (let resourceId of eventDefs[instance.defId].resourceIds) {
      hasEvents[resourceId] = true
    }
  }

  return hasEvents
}

/*
mark resources as having events if any of their ancestors have them
NOTE: resourceStore might not have all the resources that hasEvents{} has keyed
*/
function computeAncestorHasEvents(hasEvents: { [resourceId: string]: boolean }, resourceStore: ResourceHash) {
  let res = {}

  for (let resourceId in hasEvents) {
    let resource

    while ((resource = resourceStore[resourceId])) {
      resourceId = resource.parentId // now functioning as the parentId

      if (resourceId) {
        res[resourceId] = true
      } else {
        break
      }
    }
  }

  return res
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


// for making sure events that have editable resources are always draggable in resource views

export function transformIsDraggable(val: boolean, eventDef: EventDef, eventUi: EventUi, view: View) {

  if (!val) {
    if ((view.viewSpec.class as any).needsResourceData) {
      if (computeResourceEditable(eventDef, view.context.calendar)) { // yuck
        return true
      }
    }
  }

  return val
}
