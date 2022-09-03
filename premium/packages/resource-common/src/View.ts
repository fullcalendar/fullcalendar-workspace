import {
  rangesIntersect, EventInstanceHash, filterHash, ViewProps, ViewPropsTransformer, CalendarContentProps, memoize,
  EventUi, EventDefHash, EventDef, EventStore, DateRange, CalendarContext,
} from '@fullcalendar/common'
import { __assign } from 'tslib'
import { ResourceHash } from './structs/resource'
import { ResourceEntityExpansions } from './reducers/resourceEntityExpansions'
import { computeResourceEditable } from './EventDragging'

// for when resource views need resource data

export interface ResourceViewProps extends ViewProps {
  resourceStore: ResourceHash
  resourceEntityExpansions: ResourceEntityExpansions
}

export class ResourceDataAdder implements ViewPropsTransformer {
  filterResources = memoize(filterResources)

  transform(viewProps: ViewProps, calendarProps: CalendarContentProps) {
    if (calendarProps.viewSpec.optionDefaults.needsResourceData) {
      return {
        resourceStore: this.filterResources(
          calendarProps.resourceStore,
          calendarProps.options.filterResourcesWithEvents,
          calendarProps.eventStore,
          calendarProps.dateProfile.activeRange,
        ),
        resourceEntityExpansions: calendarProps.resourceEntityExpansions,
      }
    }
    return null
  }
}

function filterResources(
  resourceStore: ResourceHash,
  doFilterResourcesWithEvents: boolean,
  eventStore: EventStore,
  activeRange: DateRange,
): ResourceHash {
  if (doFilterResourcesWithEvents) {
    let instancesInRange = filterEventInstancesInRange(eventStore.instances, activeRange)
    let hasEvents = computeHasEvents(instancesInRange, eventStore.defs)

    __assign(hasEvents, computeAncestorHasEvents(hasEvents, resourceStore))

    return filterHash(resourceStore, (resource, resourceId) => hasEvents[resourceId])
  }

  return resourceStore
}

function filterEventInstancesInRange(eventInstances: EventInstanceHash, activeRange: DateRange) {
  return filterHash(eventInstances, (eventInstance) => rangesIntersect(eventInstance.range, activeRange))
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

/*
for making sure events that have editable resources are always draggable in resource views
*/
export function transformIsDraggable(val: boolean, eventDef: EventDef, eventUi: EventUi, context: CalendarContext) {
  if (!val) {
    let state = context.getCurrentData()
    let viewSpec = state.viewSpecs[state.currentViewType]

    if (viewSpec.optionDefaults.needsResourceData) {
      if (computeResourceEditable(eventDef, context)) {
        return true
      }
    }
  }

  return val
}
