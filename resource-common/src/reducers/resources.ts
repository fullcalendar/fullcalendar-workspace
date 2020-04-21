import { CalendarState, ReducerContext } from '@fullcalendar/core'
import { reduceResourceSource } from './resourceSource'
import { reduceResourceStore } from './resourceStore'
import { reduceResourceEntityExpansions } from './resourceEntityExpansions'
import { ResourceAction } from './resource-action'

export function reduceResources(state: CalendarState, action: ResourceAction, context: ReducerContext) {
  let resourceSource = reduceResourceSource(state.resourceSource, action, state.dateProfile, context)
  let resourceStore = reduceResourceStore(state.resourceStore, action, resourceSource, context)
  let resourceEntityExpansions = reduceResourceEntityExpansions(state.resourceEntityExpansions, action)

  return {
    ...state,
    resourceSource,
    resourceStore,
    resourceEntityExpansions
  }
}
