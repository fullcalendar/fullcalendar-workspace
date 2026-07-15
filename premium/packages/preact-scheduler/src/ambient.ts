import {} from '@fullcalendar/core/protected-api'
import {
  PremiumListeners,
  PremiumListenersRefined,
  PremiumOptions,
  PremiumOptionsRefined,
} from './common/options'
import { ResourceApi } from './resource/api/ResourceApi'
import { ResourceSource } from './resource/structs/resource-source'
import { ResourceHash } from './resource/structs/resource'
import { ResourceEntityExpansions } from './resource/reducers/resourceEntityExpansions'
import { ResourceAction } from './resource/reducers/resource-action'
import { EVENT_REFINERS } from './resource/structs/event-parse'

type ExtraEventRefiners = typeof EVENT_REFINERS

declare module '@fullcalendar/preact/public-api' {
  interface DatePointApi {
    resource?: ResourceApi
  }

  interface DateSpanApi {
    resource?: ResourceApi
  }

  interface EventDropInfo {
    oldResource?: ResourceApi
    newResource?: ResourceApi
  }
}

declare module '@fullcalendar/core/protected-api' {
  interface BaseOptions extends PremiumOptions {}
  interface BaseOptionsRefined extends PremiumOptionsRefined {}
  interface EventRefiners extends ExtraEventRefiners {}
}

declare module '@fullcalendar/preact/protected-api' {
  interface CalendarListeners extends PremiumListeners {}
  interface CalendarListenersRefined extends PremiumListenersRefined {}

  interface CalendarContext {
    dispatch(action: ResourceAction): void
  }

  interface CalendarData {
    resourceSource?: ResourceSource<any>
    resourceStore?: ResourceHash
    resourceEntityExpansions?: ResourceEntityExpansions
  }

  interface EventMutation {
    resourceMutation?: { matchResourceId: string, setResourceId: string }
  }

  interface EventDef {
    resourceIds?: string[]
    resourceEditable?: boolean
  }
}
