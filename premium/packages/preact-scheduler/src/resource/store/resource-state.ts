import { CalendarContext, DateProfile, ReduceEffects } from '@fullcalendar/preact/protected-api'
import { ResourceSource } from '../resource-sources/resource-source'
import { ResourceHash } from '../resource'
import { reduceResourceSource } from './reducers/resource-source'
import { reduceResourceStore } from './reducers/resource-store'
import { reduceResourceEntityExpansions, ResourceEntityExpansions } from './reducers/resource-entity-expansions'
import { ResourceAction } from './actions'

/*
The resource plugin's slice of the calendar state, and its reducer (the plugin's `reducers` entry).
The source reduces first: the store reads the source's fetch state
*/
export interface ResourceState {
  resourceSource: ResourceSource<any>
  resourceStore: ResourceHash
  resourceEntityExpansions: ResourceEntityExpansions
}

export function reduceResources(
  state: ResourceState | undefined,
  action: ResourceAction | undefined,
  context: CalendarContext & { dateProfile: DateProfile },
  effects: ReduceEffects,
) {
  let resourceSource = reduceResourceSource(state && state.resourceSource, action, context, effects)
  let resourceStore = reduceResourceStore(state && state.resourceStore, action, resourceSource, context)
  let resourceEntityExpansions = reduceResourceEntityExpansions(state && state.resourceEntityExpansions, action)

  return {
    resourceSource,
    resourceStore,
    resourceEntityExpansions,
  }
}
