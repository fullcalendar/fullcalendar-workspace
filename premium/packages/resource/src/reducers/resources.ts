import { CalendarContext, DateProfile } from '@fullcalendar/core/internal'
import { ResourceSource } from '../structs/resource-source.js'
import { ResourceHash } from '../structs/resource.js'
import { reduceResourceSource } from './resourceSource.js'
import { reduceResourceStore } from './resourceStore.js'
import { reduceResourceEntityExpansions, ResourceEntityExpansions } from './resourceEntityExpansions.js'
import { ResourceAction } from './resource-action.js'

export interface ResourceState {
  resourceSource: ResourceSource<any>
  resourceStore: ResourceHash
  resourceEntityExpansions: ResourceEntityExpansions
}

export function reduceResources(
  state: ResourceState | null,
  action: ResourceAction | null,
  context: CalendarContext & { dateProfile: DateProfile },
) {
  let resourceSource = reduceResourceSource(state && state.resourceSource, action, context)
  let resourceStore = reduceResourceStore(state && state.resourceStore, action, resourceSource, context)
  let resourceEntityExpansions = reduceResourceEntityExpansions(state && state.resourceEntityExpansions, action)

  return {
    resourceSource,
    resourceStore,
    resourceEntityExpansions,
  }
}
