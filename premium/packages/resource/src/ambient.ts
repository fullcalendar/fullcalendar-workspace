import { ResourceApi } from './api/ResourceApi'
import { ResourceSource } from './structs/resource-source'
import { ResourceHash } from './structs/resource'
import { ResourceEntityExpansions } from './reducers/resourceEntityExpansions'
import { ResourceAction } from './reducers/resource-action'
import {
  ResourceOptions,
  ResourceOptionsRefined,
  ResourceListeners,
  ResourceListenersRefined,
} from './options'
import { EVENT_REFINERS } from './structs/event-parse'

// all dependencies except core
import '@fullcalendar/premium-common'

type ExtraEventRefiners = typeof EVENT_REFINERS

declare module '@fullcalendar/core' {
  interface DatePointApi {
    resource?: ResourceApi
  }

  interface DateSpanApi {
    resource?: ResourceApi
  }

  interface EventDropData {
    oldResource?: ResourceApi
    newResource?: ResourceApi
  }
}

declare module '@fullcalendar/core/internal' {
  interface BaseOptions extends ResourceOptions {}
  interface BaseOptionsRefined extends ResourceOptionsRefined {}
  interface CalendarListeners extends ResourceListeners {}
  interface CalendarListenersRefined extends ResourceListenersRefined {}

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
