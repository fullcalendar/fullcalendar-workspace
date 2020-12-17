import { ResourceApi } from './api/ResourceApi'
import { ResourceSource } from './structs/resource-source'
import { ResourceHash } from './structs/resource'
import { ResourceEntityExpansions } from './reducers/resourceEntityExpansions'
import { ResourceAction } from './reducers/resource-action'

// TODO: move these out to specific files that care about them (to -declare.ts files)

declare module '@fullcalendar/common' {

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

  interface DatePointApi {
    resource?: ResourceApi
  }

  interface DateSpanApi {
    resource?: ResourceApi
  }

  interface EventMutation {
    resourceMutation?: { matchResourceId: string, setResourceId: string }
    // TODO: rename these to removeResourceId/addResourceId?
  }

  interface EventDropArg {
    oldResource?: ResourceApi
    newResource?: ResourceApi
  }

  interface EventDef {
    resourceIds?: string[]
    resourceEditable?: boolean
  }

}
