import { Identity, CssDimValue, ClassNamesGenerator, CustomContentGenerator, DidMountHandler, WillUnmountHandler, identity, parseFieldSpecs } from '@fullcalendar/common'

// public
import {
  ResourceSourceInput,
  ResourceLabelHookProps,
  ColSpec, ColHeaderHookProps, ColCellHookProps,
  ResourceLaneHookProps
} from './api-type-deps'

export const OPTION_REFINERS = {
  schedulerLicenseKey: String,
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

  resourceAreaHeaderClassNames: identity as Identity<ClassNamesGenerator<ColHeaderHookProps>>,
  resourceAreaHeaderContent: identity as Identity<CustomContentGenerator<ColHeaderHookProps>>,
  resourceAreaHeaderDidMount: identity as Identity<DidMountHandler<ColHeaderHookProps>>,
  resourceAreaHeaderWillUnmount: identity as Identity<WillUnmountHandler<ColHeaderHookProps>>,

  resourceGroupLabelClassNames: identity as Identity<ClassNamesGenerator<ColCellHookProps>>,
  resourceGroupLabelContent: identity as Identity<CustomContentGenerator<ColCellHookProps>>,
  resourceGroupLabelDidMount: identity as Identity<DidMountHandler<ColCellHookProps>>,
  resourceGroupLabelWillUnmount: identity as Identity<WillUnmountHandler<ColCellHookProps>>,

  resourceLabelClassNames: identity as Identity<ClassNamesGenerator<ResourceLabelHookProps>>,
  resourceLabelContent: identity as Identity<CustomContentGenerator<ResourceLabelHookProps>>,
  resourceLabelDidMount: identity as Identity<DidMountHandler<ResourceLabelHookProps>>,
  resourceLabelWillUnmount: identity as Identity<WillUnmountHandler<ResourceLabelHookProps>>,

  resourceLaneClassNames: identity as Identity<ClassNamesGenerator<ResourceLaneHookProps>>,
  resourceLaneContent: identity as Identity<CustomContentGenerator<ResourceLaneHookProps>>,
  resourceLaneDidMount: identity as Identity<DidMountHandler<ResourceLaneHookProps>>,
  resourceLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceLaneHookProps>>,

  resourceGroupLaneClassNames: identity as Identity<ClassNamesGenerator<ColCellHookProps>>,
  resourceGroupLaneContent: identity as Identity<CustomContentGenerator<ColCellHookProps>>,
  resourceGroupLaneDidMount: identity as Identity<DidMountHandler<ColCellHookProps>>,
  resourceGroupLaneWillUnmount: identity as Identity<WillUnmountHandler<ColCellHookProps>>
}
