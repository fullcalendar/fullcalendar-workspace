import { ResourceApi } from './api/ResourceApi'
import { ResourceSource } from './structs/resource-source'
import { ResourceSourceInput } from './structs/resource-source-parse'
import { ResourceHash } from './structs/resource'
import { ResourceEntityExpansions } from './reducers/resourceEntityExpansions'
import { ResourceAction } from './reducers/resource-action'

declare module '@fullcalendar/common' {

  interface CalendarApi {
    addResource(input: ResourceSourceInput): ResourceApi
    getResourceById(id: string): ResourceApi | null
    getResources(): ResourceApi[]
    getTopLevelResources(): ResourceApi[]
    refetchResources(): void
  }

  interface CalendarContext {
    dispatch(action: ResourceAction): void
  }

  interface CalendarData {
    // adding in ResourceState, but make all optional. we're polluting CalendarData globally and don't want to require them
    // i wish TS allowed is to "mixin" one interface into a different ambient interface
    resourceSource?: ResourceSource
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

  interface EventApi {
    getResources: () => ResourceApi[]
    setResources: (resources: (string | ResourceApi)[]) => void
  }

  interface EventDef {
    resourceIds: string[]
    resourceEditable: boolean
  }

}
