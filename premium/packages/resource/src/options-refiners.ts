import { Identity, identity, parseFieldSpecs } from '@fullcalendar/core/internal'
import {
  ResourceSourceInput,
  ResourceApi,
  ResourceAddArg, ResourceChangeArg, ResourceRemoveArg,
} from './public-types.js'

export const OPTION_REFINERS = {
  initialResources: identity as Identity<ResourceSourceInput>,
  resources: identity as Identity<ResourceSourceInput>,

  eventResourceEditable: Boolean,
  refetchResourcesOnNavigate: Boolean,
  resourceOrder: parseFieldSpecs,
  filterResourcesWithEvents: Boolean,
  resourceGroupField: String,

  resourcesInitiallyExpanded: Boolean,
  datesAboveResources: Boolean,
  needsResourceData: Boolean, // internal-only
}

export const LISTENER_REFINERS = {
  resourcesSet: identity as Identity<(resources: ResourceApi[]) => void>,
  resourceAdd: identity as Identity<(arg: ResourceAddArg) => void>,
  resourceChange: identity as Identity<(arg: ResourceChangeArg) => void>,
  resourceRemove: identity as Identity<(arg: ResourceRemoveArg) => void>,

  // internal
  _resourceScrollRequest: identity as Identity<(resourceId: string) => void>
}
