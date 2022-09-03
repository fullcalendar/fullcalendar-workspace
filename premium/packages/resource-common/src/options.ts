import {
  Identity, CssDimValue, ClassNamesGenerator, CustomContentGenerator, DidMountHandler, WillUnmountHandler,
  identity, parseFieldSpecs,
} from '@fullcalendar/common'

// public
import {
  ResourceSourceInput,
  ResourceLabelContentArg, ResourceLabelMountArg,
  ColSpec,
  ColHeaderContentArg, ColHeaderMountArg,
  ColCellContentArg, ColCellMountArg,
  ResourceLaneContentArg, ResourceLaneMountArg,
  ResourceApi,
  ResourceAddArg, ResourceChangeArg, ResourceRemoveArg,
} from './api-type-deps'

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

  resourceAreaHeaderClassNames: identity as Identity<ClassNamesGenerator<ColHeaderContentArg>>,
  resourceAreaHeaderContent: identity as Identity<CustomContentGenerator<ColHeaderContentArg>>,
  resourceAreaHeaderDidMount: identity as Identity<DidMountHandler<ColHeaderMountArg>>,
  resourceAreaHeaderWillUnmount: identity as Identity<WillUnmountHandler<ColHeaderMountArg>>,

  resourceGroupLabelClassNames: identity as Identity<ClassNamesGenerator<ColCellContentArg>>,
  resourceGroupLabelContent: identity as Identity<CustomContentGenerator<ColCellContentArg>>,
  resourceGroupLabelDidMount: identity as Identity<DidMountHandler<ColCellMountArg>>,
  resourceGroupLabelWillUnmount: identity as Identity<WillUnmountHandler<ColCellMountArg>>,

  resourceLabelClassNames: identity as Identity<ClassNamesGenerator<ResourceLabelContentArg>>,
  resourceLabelContent: identity as Identity<CustomContentGenerator<ResourceLabelContentArg>>,
  resourceLabelDidMount: identity as Identity<DidMountHandler<ResourceLabelMountArg>>,
  resourceLabelWillUnmount: identity as Identity<WillUnmountHandler<ResourceLabelMountArg>>,

  resourceLaneClassNames: identity as Identity<ClassNamesGenerator<ResourceLaneContentArg>>,
  resourceLaneContent: identity as Identity<CustomContentGenerator<ResourceLaneContentArg>>,
  resourceLaneDidMount: identity as Identity<DidMountHandler<ResourceLaneMountArg>>,
  resourceLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceLaneMountArg>>,

  resourceGroupLaneClassNames: identity as Identity<ClassNamesGenerator<ColCellContentArg>>,
  resourceGroupLaneContent: identity as Identity<CustomContentGenerator<ColCellContentArg>>,
  resourceGroupLaneDidMount: identity as Identity<DidMountHandler<ColCellMountArg>>,
  resourceGroupLaneWillUnmount: identity as Identity<WillUnmountHandler<ColCellMountArg>>,
}

export const LISTENER_REFINERS = {
  resourcesSet: identity as Identity<(resources: ResourceApi[]) => void>,
  resourceAdd: identity as Identity<(arg: ResourceAddArg) => void>,
  resourceChange: identity as Identity<(arg: ResourceChangeArg) => void>,
  resourceRemove: identity as Identity<(arg: ResourceRemoveArg) => void>,
}
