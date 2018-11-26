import { Calendar, CalendarState, Action, assignTo, DateRange } from 'fullcalendar'
import { ResourceSource, ResourceSourceError } from '../structs/resource-source'
import { ResourceHash, ResourceInput } from '../structs/resource'
import reduceResourceSource from './resourceSource'
import reduceResourceStore from './resourceStore'
import { reduceResourceEntityExpansions, ResourceEntityExpansions } from './resourceEntityExpansions'

declare module 'fullcalendar/src/reducers/types' {
  interface CalendarState {
    resourceSource: ResourceSource | null
    resourceStore: ResourceHash
    resourceEntityExpansions: ResourceEntityExpansions
  }
}

declare module 'fullcalendar/Calendar' {
  interface Default {
    dispatch(action: ResourceAction)
  }
}

export type ResourceAction = Action |
  { type: 'FETCH_RESOURCE' } |
  { type: 'RECEIVE_RESOURCES', rawResources: ResourceInput[], fetchId: string, fetchRange: DateRange | null } |
  { type: 'RECEIVE_RESOURCE_ERROR', error: ResourceSourceError, fetchId: string, fetchRange: DateRange | null } |
  { type: 'SET_RESOURCE_PROP', resourceId: string, propName: string, propValue: any } |
  { type: 'SET_RESOURCE_ENTITY_EXPANDED', id: string, isExpanded: boolean }

export default function(state: CalendarState, action: ResourceAction, calendar: Calendar) {
  let resourceSource = reduceResourceSource(state.resourceSource, action, state.dateProfile, calendar)
  let resourceStore = reduceResourceStore(state.resourceStore, action, resourceSource, calendar)
  let resourceEntityExpansions = reduceResourceEntityExpansions(state.resourceEntityExpansions, action)

  return assignTo({}, state, {
    resourceSource,
    resourceStore,
    resourceEntityExpansions
  })
}
