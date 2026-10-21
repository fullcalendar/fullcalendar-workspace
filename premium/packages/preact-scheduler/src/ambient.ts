import {} from '@fullcalendar/core/protected-api'
import {
  PremiumListeners,
  PremiumListenersRefined,
  PremiumOptions,
  PremiumOptionsRefined,
} from './premium-common/options'
import { ResourceApi } from './resource/api/ResourceApi'
import { ResourceSource } from './resource/resource-sources/resource-source'
import { ResourceHash } from './resource/resource'
import { ResourceEntityExpansions } from './resource/store/reducers/resource-entity-expansions'
import { ResourceAction } from './resource/store/actions'
import { EVENT_REFINERS } from './resource/event-resource-parse'

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

  // the resource whose column/lane the event is rendered within
  // (EventDisplayInfo extends this)
  interface EventTextInfo {
    resource?: ResourceApi
  }

  // the resource whose column/lane the more-link is rendered within
  interface MoreLinkInfo {
    resource?: ResourceApi
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
