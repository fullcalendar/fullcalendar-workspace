import { ResourceApi } from './api/ResourceApi'
import { ResourceSourceInput, ResourceSource } from './structs/resource-source'
import { ResourceHash } from './structs/resource'
import { ResourceEntityExpansions } from './reducers/resourceEntityExpansions'
import { ResourceAction } from './reducers/resources'

// QUESTION: why do only some files need to require this directly?

declare module '@fullcalendar/core' {

  interface CalendarApi {
    addResource(input: ResourceSourceInput): ResourceApi
    getResourceById(id: string): ResourceApi | null
    getResources(): ResourceApi[]
    getTopLevelResources(): ResourceApi[]
    refetchResources(): void
  }

  interface ReducerContext {
    dispatch(action: ResourceAction): void
  }

  interface CalendarState {
    resourceSource?: ResourceSource | null
    resourceStore?: ResourceHash
    resourceEntityExpansions?: ResourceEntityExpansions
  }

  interface OptionsInput {
    schedulerLicenseKey?: string
    resources?: ResourceSourceInput

    // TODO: make these better
    resourceOrder?: any
    filterResourcesWithEvents?: any
    resourceGroupField?: any
    resourceAreaWidth?: any
    resourceAreaColumns?: any
    resourcesInitiallyExpanded?: any
    slotMinWidth?: any
    datesAboveResources?: any
    eventResourceEditable?: boolean
    refetchResourcesOnNavigate?: boolean
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
