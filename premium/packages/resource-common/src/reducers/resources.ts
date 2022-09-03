import { CalendarContext, DateProfile } from '@fullcalendar/common'
import { ResourceSource } from '../structs/resource-source'
import { ResourceHash } from '../structs/resource'
import { reduceResourceSource } from './resourceSource'
import { reduceResourceStore } from './resourceStore'
import { reduceResourceEntityExpansions, ResourceEntityExpansions } from './resourceEntityExpansions'
import { ResourceAction } from './resource-action'

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
