import { Identity, CssDimValue, ClassNameGenerator, CustomContentGenerator, DidMountHandler, WillUnmountHandler, identity } from '@fullcalendar/common'
import { ResourceSourceInput } from './structs/resource-source-parse'
import { ResourceLabelHookProps } from './common/ResourceLabelRoot'
import { ColSpec, ColHeaderHookProps, ColCellHookProps } from './common/resource-spec'
import { ResourceLaneHookProps } from './render-hooks'

export const OPTION_REFINERS = {
  schedulerLicenseKey: String,
  resources: identity as Identity<ResourceSourceInput>,
  eventResourceEditable: Boolean,
  refetchResourcesOnNavigate: Boolean,
  resourceOrder: identity as Identity<any>, // TODO: come up with real spec for this
  filterResourcesWithEvents: Boolean,
  resourceGroupField: String,
  resourceAreaWidth: identity as Identity<CssDimValue>,
  resourceAreaColumns: identity as Identity<ColSpec[]>,
  resourcesInitiallyExpanded: Boolean,
  datesAboveResources: Boolean,
  needsResourceData: Boolean, // internal-only

  resourceAreaHeaderClassNames: identity as Identity<ClassNameGenerator<ColHeaderHookProps>>,
  resourceAreaHeaderContent: identity as Identity<CustomContentGenerator<ColHeaderHookProps>>,
  resourceAreaHeaderDidMount: identity as Identity<DidMountHandler<ColHeaderHookProps>>,
  resourceAreaHeaderWillUnmount: identity as Identity<WillUnmountHandler<ColHeaderHookProps>>,

  resourceGroupLabelClassNames: identity as Identity<ClassNameGenerator<ColCellHookProps>>,
  resourceGroupLabelContent: identity as Identity<CustomContentGenerator<ColCellHookProps>>,
  resourceGroupLabelDidMount: identity as Identity<DidMountHandler<ColCellHookProps>>,
  resourceGroupLabelWillUnmount: identity as Identity<WillUnmountHandler<ColCellHookProps>>,

  resourceLabelClassNames: identity as Identity<ClassNameGenerator<ResourceLabelHookProps>>,
  resourceLabelContent: identity as Identity<CustomContentGenerator<ResourceLabelHookProps>>,
  resourceLabelDidMount: identity as Identity<DidMountHandler<ResourceLabelHookProps>>,
  resourceLabelWillUnmount: identity as Identity<WillUnmountHandler<ResourceLabelHookProps>>,

  resourceLaneClassNames: identity as Identity<ClassNameGenerator<ResourceLaneHookProps>>,
  resourceLaneContent: identity as Identity<CustomContentGenerator<ResourceLaneHookProps>>,
  resourceLaneDidMount: identity as Identity<DidMountHandler<ResourceLaneHookProps>>,
  resourceLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceLaneHookProps>>,

  resourceGroupLaneClassNames: identity as Identity<ClassNameGenerator<ColCellHookProps>>,
  resourceGroupLaneContent: identity as Identity<CustomContentGenerator<ColCellHookProps>>,
  resourceGroupLaneDidMount: identity as Identity<DidMountHandler<ColCellHookProps>>,
  resourceGroupLaneWillUnmount: identity as Identity<WillUnmountHandler<ColCellHookProps>>
}

// add types
type ExtraOptionRefiners = typeof OPTION_REFINERS
declare module '@fullcalendar/common' {
  interface BaseOptionRefiners extends ExtraOptionRefiners {}
}
