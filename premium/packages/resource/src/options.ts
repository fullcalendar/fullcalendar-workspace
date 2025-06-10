import { Identity, identity, parseFieldSpecs, RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/core/internal'
import {
  ResourceSourceInput,
  ResourceApi,
  ResourceAddData, ResourceChangeData, ResourceRemoveData,
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

type ResourceOptionRefiners = typeof OPTION_REFINERS
export type ResourceOptions = RawOptionsFromRefiners<ResourceOptionRefiners>
export type ResourceOptionsRefined = RefinedOptionsFromRefiners<ResourceOptionRefiners>

export const LISTENER_REFINERS = {
  resourcesSet: identity as Identity<(resources: ResourceApi[]) => void>,
  resourceAdd: identity as Identity<(arg: ResourceAddData) => void>,
  resourceChange: identity as Identity<(arg: ResourceChangeData) => void>,
  resourceRemove: identity as Identity<(arg: ResourceRemoveData) => void>,

  // internal
  _resourceScrollRequest: identity as Identity<(resourceId: string) => void>
}

type ResourceListenerRefiners = typeof LISTENER_REFINERS
export type ResourceListeners = RawOptionsFromRefiners<ResourceListenerRefiners>
export type ResourceListenersRefined = RefinedOptionsFromRefiners<ResourceListenerRefiners>
