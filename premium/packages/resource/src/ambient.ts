import { ResourceApi } from './api/ResourceApi.js'
import { ResourceSource } from './structs/resource-source.js'
import { ResourceHash } from './structs/resource.js'
import { ResourceEntityExpansions } from './reducers/resourceEntityExpansions.js'
import { ResourceAction } from './reducers/resource-action.js'
import { OPTION_REFINERS, LISTENER_REFINERS } from './options-refiners.js'
import { EVENT_REFINERS } from './structs/event-parse.js'

type ExtraOptionRefiners = typeof OPTION_REFINERS
type ExtraListenerRefiners = typeof LISTENER_REFINERS
type ExtraEventRefiners = typeof EVENT_REFINERS

declare module '@fullcalendar/core' {
  interface DatePointApi {
    resource?: ResourceApi
  }

  interface DateSpanApi {
    resource?: ResourceApi
  }

  interface EventDropArg {
    oldResource?: ResourceApi
    newResource?: ResourceApi
  }
}

declare module '@fullcalendar/core/internal' {
  interface BaseOptionRefiners extends ExtraOptionRefiners {}
  interface CalendarListenerRefiners extends ExtraListenerRefiners {}
  interface EventRefiners extends ExtraEventRefiners {}

  interface CalendarContext {
    dispatch(action: ResourceAction): void
  }

  interface CalendarData {
    // adding in ResourceState, but make all optional. we're polluting CalendarData globally and don't want to require them
    // i wish TS allowed is to "mixin" one interface into a different ambient interface
    resourceSource?: ResourceSource<any>
    resourceStore?: ResourceHash
    resourceEntityExpansions?: ResourceEntityExpansions
  }

  interface EventMutation {
    resourceMutation?: { matchResourceId: string, setResourceId: string }
    // TODO: rename these to removeResourceId/addResourceId?
  }

  interface EventDef {
    resourceIds?: string[]
    resourceEditable?: boolean
  }
}
