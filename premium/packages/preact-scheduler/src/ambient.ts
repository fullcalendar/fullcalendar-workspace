import {} from '@fullcalendar/core/protected-api'
import { PremiumOptions, PremiumOptionsRefined } from './common/options'
import { ResourceApi } from './resource/api/ResourceApi'
import { ResourceSource } from './resource/structs/resource-source'
import { ResourceHash } from './resource/structs/resource'
import { ResourceEntityExpansions } from './resource/reducers/resourceEntityExpansions'
import { ResourceAction } from './resource/reducers/resource-action'
import {
  ResourceOptions,
  ResourceOptionsRefined,
  ResourceListeners,
  ResourceListenersRefined,
} from './resource/options'
import { EVENT_REFINERS } from './resource/structs/event-parse'
import { ResourceDayGridOptions, ResourceDayGridOptionsRefined } from './resource-daygrid/options'
import { ResourceTimelineOptions, ResourceTimelineOptionsRefined } from './resource-timeline/options'
import { TimelineOptions, TimelineOptionsRefined } from './timeline/options'

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
  interface BaseOptions extends PremiumOptions, ResourceOptions, ResourceDayGridOptions, ResourceTimelineOptions, TimelineOptions {}
  interface BaseOptionsRefined extends PremiumOptionsRefined, ResourceOptionsRefined, ResourceDayGridOptionsRefined, ResourceTimelineOptionsRefined, TimelineOptionsRefined {}
  interface EventRefiners extends ExtraEventRefiners {}
}

declare module '@fullcalendar/preact/protected-api' {
  interface CalendarListeners extends ResourceListeners {}
  interface CalendarListenersRefined extends ResourceListenersRefined {}

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
