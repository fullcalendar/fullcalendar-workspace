import { ClassNamesGenerator, CssDimValue } from '@fullcalendar/core'
import {
  Identity, identity, parseFieldSpecs,
  CustomContentGenerator, DidMountHandler, WillUnmountHandler,
} from '@fullcalendar/core/internal'
import {
  ResourceSourceInput,
  ColSpec,
  ResourceColumnHeaderContentArg, ResourceColumnHeaderMountArg,
  ResourceLaneContentArg, ResourceLaneMountArg,
  ResourceApi,
  ResourceAddArg, ResourceChangeArg, ResourceRemoveArg,
  ResourceDayHeaderContentArg,
  ResourceDayHeaderMountArg,
  ResourceCellContentArg,
  ResourceCellMountArg,
  ResourceGroupHeaderContentArg,
  ResourceGroupHeaderMountArg,
  ResourceGroupLaneContentArg,
  ResourceGroupLaneMountArg,
} from './public-types.js'

export const OPTION_REFINERS = {
  initialResources: identity as Identity<ResourceSourceInput>,
  resources: identity as Identity<ResourceSourceInput>,

  eventResourceEditable: Boolean,
  refetchResourcesOnNavigate: Boolean,
  resourceOrder: parseFieldSpecs,
  filterResourcesWithEvents: Boolean,
  resourceGroupField: String,
  resourceAreaWidth: identity as Identity<CssDimValue>,
  resourceAreaColumns: identity as Identity<ColSpec[]>,
  resourcesInitiallyExpanded: Boolean,
  datesAboveResources: Boolean,
  needsResourceData: Boolean, // internal-only

  // for vresource view
  resourceDayHeaderClassNames: identity as Identity<ClassNamesGenerator<ResourceDayHeaderContentArg>>,
  resourceDayHeaderContent: identity as Identity<CustomContentGenerator<ResourceDayHeaderContentArg>>,
  resourceDayHeaderDidMount: identity as Identity<DidMountHandler<ResourceDayHeaderMountArg>>,
  resourceDayHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceDayHeaderMountArg>>,

  // datagrid super-header & normal column headers
  resourceAreaHeaderClassNames: identity as Identity<ClassNamesGenerator<ResourceColumnHeaderContentArg>>,
  resourceAreaHeaderContent: identity as Identity<CustomContentGenerator<ResourceColumnHeaderContentArg>>,
  resourceAreaHeaderDidMount: identity as Identity<DidMountHandler<ResourceColumnHeaderMountArg>>,
  resourceAreaHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceColumnHeaderMountArg>>,

  // datagrid cells, for both resources & resource-GROUP
  resourceCellClassNames: identity as Identity<ClassNamesGenerator<ResourceCellContentArg>>,
  resourceCellContent: identity as Identity<CustomContentGenerator<ResourceCellContentArg>>,
  resourceCellDidMount: identity as Identity<DidMountHandler<ResourceCellMountArg>>,
  resourceCellWillUnmount: identity as Identity<WillUnmountHandler<ResourceCellMountArg>>,

  // datagrid, for resource-GROUP entire row
  resourceGroupHeaderClassNames: identity as Identity<ClassNamesGenerator<ResourceGroupHeaderContentArg>>,
  resourceGroupHeaderContent: identity as Identity<CustomContentGenerator<ResourceGroupHeaderContentArg>>,
  resourceGroupHeaderDidMount: identity as Identity<DidMountHandler<ResourceGroupHeaderMountArg>>,
  resourceGroupHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupHeaderMountArg>>,

  // timeline lane, for resource-GROUP
  resourceGroupLaneClassNames: identity as Identity<ClassNamesGenerator<ResourceGroupLaneContentArg>>,
  resourceGroupLaneContent: identity as Identity<CustomContentGenerator<ResourceGroupLaneContentArg>>,
  resourceGroupLaneDidMount: identity as Identity<DidMountHandler<ResourceGroupLaneMountArg>>,
  resourceGroupLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupLaneMountArg>>,

  // timeline, lane, for resource
  resourceLaneClassNames: identity as Identity<ClassNamesGenerator<ResourceLaneContentArg>>,
  resourceLaneContent: identity as Identity<CustomContentGenerator<ResourceLaneContentArg>>,
  resourceLaneDidMount: identity as Identity<DidMountHandler<ResourceLaneMountArg>>,
  resourceLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceLaneMountArg>>,
}

export const LISTENER_REFINERS = {
  resourcesSet: identity as Identity<(resources: ResourceApi[]) => void>,
  resourceAdd: identity as Identity<(arg: ResourceAddArg) => void>,
  resourceChange: identity as Identity<(arg: ResourceChangeArg) => void>,
  resourceRemove: identity as Identity<(arg: ResourceRemoveArg) => void>,

  // internal
  _resourceScrollRequest: identity as Identity<(resourceId: string) => void>
}
