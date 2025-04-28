import { ClassNamesGenerator, ClassNamesInput, CssDimValue } from '@fullcalendar/core'
import {
  Identity, identity,
  CustomContentGenerator, DidMountHandler, WillUnmountHandler,
  RawOptionsFromRefiners,
  RefinedOptionsFromRefiners,
} from '@fullcalendar/core/internal'
import {
  ResourceColumnHeaderContentArg,
  ResourceColumnHeaderMountArg,
  ResourceCellContentArg,
  ResourceCellMountArg,
  ResourceGroupHeaderContentArg,
  ResourceGroupHeaderMountArg,
  ResourceGroupLaneContentArg,
  ResourceGroupLaneMountArg,
  ResourceLaneContentArg,
  ResourceLaneMountArg,
  ColSpec,
} from './structs.js'

export const OPTION_REFINERS = {
  resourceAreaWidth: identity as Identity<CssDimValue>,
  resourceAreaColumns: identity as Identity<ColSpec[]>,

  // datagrid super-header & normal column headers
  resourceAreaHeaderClassNames: identity as Identity<ClassNamesGenerator<ResourceColumnHeaderContentArg>>,
  resourceAreaHeaderInnerClassNames: identity as Identity<ClassNamesGenerator<ResourceColumnHeaderContentArg>>,
  resourceAreaHeaderContent: identity as Identity<CustomContentGenerator<ResourceColumnHeaderContentArg>>,
  resourceAreaHeaderDidMount: identity as Identity<DidMountHandler<ResourceColumnHeaderMountArg>>,
  resourceAreaHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceColumnHeaderMountArg>>,
  resourceAreaHeaderRowClassNames: identity as Identity<ClassNamesInput>, // between super-header and normal headers
  resourceAreaRowClassNames: identity as Identity<ClassNamesInput>,

  // datagrid cells, for both resources & resource-GROUP
  resourceCellClassNames: identity as Identity<ClassNamesGenerator<ResourceCellContentArg>>,
  resourceCellInnerClassNames: identity as Identity<ClassNamesGenerator<ResourceCellContentArg>>,
  resourceCellContent: identity as Identity<CustomContentGenerator<ResourceCellContentArg>>,
  resourceCellDidMount: identity as Identity<DidMountHandler<ResourceCellMountArg>>,
  resourceCellWillUnmount: identity as Identity<WillUnmountHandler<ResourceCellMountArg>>,

  // datagrid, for resource-GROUP entire row
  resourceGroupHeaderClassNames: identity as Identity<ClassNamesGenerator<ResourceGroupHeaderContentArg>>,
  resourceGroupHeaderInnerClassNames: identity as Identity<ClassNamesGenerator<ResourceGroupHeaderContentArg>>,
  resourceGroupHeaderContent: identity as Identity<CustomContentGenerator<ResourceGroupHeaderContentArg>>,
  resourceGroupHeaderDidMount: identity as Identity<DidMountHandler<ResourceGroupHeaderMountArg>>,
  resourceGroupHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupHeaderMountArg>>,

  // timeline lane, for resource-GROUP
  resourceGroupLaneClassNames: identity as Identity<ClassNamesGenerator<ResourceGroupLaneContentArg>>,
  resourceGroupLaneInnerClassNames: identity as Identity<ClassNamesGenerator<ResourceGroupLaneContentArg>>,
  resourceGroupLaneContent: identity as Identity<CustomContentGenerator<ResourceGroupLaneContentArg>>,
  resourceGroupLaneDidMount: identity as Identity<DidMountHandler<ResourceGroupLaneMountArg>>,
  resourceGroupLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupLaneMountArg>>,

  // timeline, lane, for resource
  resourceLaneClassNames: identity as Identity<ClassNamesGenerator<ResourceLaneContentArg>>,
  resourceLaneContent: identity as Identity<CustomContentGenerator<ResourceLaneContentArg>>,
  resourceLaneDidMount: identity as Identity<DidMountHandler<ResourceLaneMountArg>>,
  resourceLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceLaneMountArg>>,
  resourceLaneTopClassNames: identity as Identity<ClassNamesInput>,
  resourceLaneBottomClassNames: identity as Identity<ClassNamesGenerator<{ isCompact: boolean }>>,
  resourceAreaDividerClassNames: identity as Identity<ClassNamesInput>,

  resourceIndentClassNames: identity as Identity<ClassNamesInput>,
  resourceExpanderClassNames: identity as Identity<ClassNamesInput>,
}

type ResourceTimelineOptionRefiners = typeof OPTION_REFINERS
export type ResourceTimelineOptions = RawOptionsFromRefiners<ResourceTimelineOptionRefiners>
export type ResourceTimelineOptionsRefined = RefinedOptionsFromRefiners<ResourceTimelineOptionRefiners>
