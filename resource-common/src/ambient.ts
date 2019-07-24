import ResourceApi from './api/ResourceApi'
import { ResourceSourceInput, ResourceSource } from './structs/resource-source'
import { View } from '@fullcalendar/core'
import { ResourceHash } from './structs/resource'
import { ResourceEntityExpansions } from './reducers/resourceEntityExpansions'
import { ResourceAction } from './reducers/resources'

// QUESTION: why do only some files need to require this directly?

declare module '@fullcalendar/core' {

  interface Calendar {
    addResource(input: ResourceSourceInput): ResourceApi
    getResourceById(id: string): ResourceApi | null
    getResources(): ResourceApi[]
    getTopLevelResources(): ResourceApi[]
    rerenderResources(): void
    refetchResources(): void
  }

  interface Calendar {
    dispatch(action: ResourceAction)
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
    resourceLabelText?: string
    resourceOrder?: any
    filterResourcesWithEvents?: any
    resourceText?: any
    resourceGroupField?: any
    resourceGroupText?: any
    resourceAreaWidth?: any
    resourceColumns?: any
    resourcesInitiallyExpanded?: any
    slotWidth?: any
    datesAboveResources?: any
    eventResourceEditable?: boolean
    refetchResourcesOnNavigate?: boolean
    resourceRender?(arg: { resource: ResourceApi, el: HTMLElement, view: View }): void // BAD: also defined in core
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
