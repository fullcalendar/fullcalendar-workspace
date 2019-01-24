import { SplittableProps, Calendar, EventUi, isPropsValid, Constraint, EventStore, mergeEventStores } from '@fullcalendar/core'
import ResourceSplitter from './common/ResourceSplitter'

export function isPropsValidWithResources(props: SplittableProps, calendar: Calendar): boolean {
  let splitter = new ResourceSplitter()

  let sets = splitter.splitProps({
    ...props,
    resourceStore: calendar.state.resourceStore
  })

  for (let resourceId in sets) {
    let props = sets[resourceId]

    // merge in event data from the non-resource segment
    if (resourceId && sets['']) { // current segment is not the non-resource one, and there IS a non-resource one
      props = {
        ...props,
        eventStore: mergeEventStores(sets[''].eventStore, props.eventStore),
        eventUiBases: { ...sets[''].eventUiBases, ...props.eventUiBases }
      }
    }

    if (!isPropsValid(props, calendar, { resourceId }, filterConfig.bind(null, resourceId))) {
      return false
    }
  }

  return true
}

function filterConfig(resourceId, config: EventUi) {
  return {
    ...config,
    constraints: filterConstraints(resourceId, config.constraints)
  }
}

function filterConstraints(resourceId: string, constraints: Constraint[]) {
  return constraints.map(function(constraint) {

    let defs = (constraint as EventStore).defs
    if (defs) { // we are dealing with an EventStore
      // if any of the events define constraints to resources that are NOT this resource,
      // then this resource is unconditionally prohibited, which is what a `false` value does.
      for (let defId in defs) {
        let resourceIds = defs[defId].resourceIds
        if (resourceIds.length && resourceIds.indexOf(resourceId) === -1) { // TODO: use a hash?!!! (for other reasons too)
          return false
        }
      }
    }

    return constraint
  })
}
