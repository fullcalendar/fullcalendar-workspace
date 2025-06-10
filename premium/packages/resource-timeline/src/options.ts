import { ClassNamesGenerator, ClassNamesInput, CssDimValue } from '@fullcalendar/core'
import {
  Identity, identity,
  CustomContentGenerator, DidMountHandler, WillUnmountHandler,
  RawOptionsFromRefiners,
  RefinedOptionsFromRefiners,
} from '@fullcalendar/core/internal'
import {
  ResourceColumnHeaderData,
  ResourceColumnHeaderMountData,
  ResourceCellData,
  ResourceCellMountData,
  ResourceGroupHeaderData,
  ResourceGroupHeaderMountData,
  ResourceGroupLaneData,
  ResourceGroupLaneMountData,
  ResourceLaneData,
  ResourceLaneMountData,
  ColSpec,
  ResourceExpanderData,
} from './structs.js'

export const OPTION_REFINERS = {
  resourceAreaWidth: identity as Identity<CssDimValue>,
  resourceAreaColumns: identity as Identity<ColSpec[]>,

  // datagrid super-header & normal column headers
  resourceAreaHeaderClassNames: identity as Identity<ClassNamesGenerator<ResourceColumnHeaderData>>,
  resourceAreaHeaderInnerClassNames: identity as Identity<ClassNamesGenerator<ResourceColumnHeaderData>>,
  resourceAreaHeaderContent: identity as Identity<CustomContentGenerator<ResourceColumnHeaderData>>,
  resourceAreaHeaderDidMount: identity as Identity<DidMountHandler<ResourceColumnHeaderMountData>>,
  resourceAreaHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceColumnHeaderMountData>>,
  resourceAreaHeaderRowClassNames: identity as Identity<ClassNamesInput>, // between super-header and normal headers
  resourceAreaRowClassNames: identity as Identity<ClassNamesInput>,

  // datagrid cells, for both resources & resource-GROUP
  resourceCellClassNames: identity as Identity<ClassNamesGenerator<ResourceCellData>>,
  resourceCellInnerClassNames: identity as Identity<ClassNamesGenerator<ResourceCellData>>,
  resourceCellContent: identity as Identity<CustomContentGenerator<ResourceCellData>>,
  resourceCellDidMount: identity as Identity<DidMountHandler<ResourceCellMountData>>,
  resourceCellWillUnmount: identity as Identity<WillUnmountHandler<ResourceCellMountData>>,

  // datagrid, for resource-GROUP entire row
  resourceGroupHeaderClassNames: identity as Identity<ClassNamesGenerator<ResourceGroupHeaderData>>,
  resourceGroupHeaderInnerClassNames: identity as Identity<ClassNamesGenerator<ResourceGroupHeaderData>>,
  resourceGroupHeaderContent: identity as Identity<CustomContentGenerator<ResourceGroupHeaderData>>,
  resourceGroupHeaderDidMount: identity as Identity<DidMountHandler<ResourceGroupHeaderMountData>>,
  resourceGroupHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupHeaderMountData>>,

  // timeline lane, for resource-GROUP
  resourceGroupLaneClassNames: identity as Identity<ClassNamesGenerator<ResourceGroupLaneData>>,
  resourceGroupLaneInnerClassNames: identity as Identity<ClassNamesGenerator<ResourceGroupLaneData>>,
  resourceGroupLaneContent: identity as Identity<CustomContentGenerator<ResourceGroupLaneData>>,
  resourceGroupLaneDidMount: identity as Identity<DidMountHandler<ResourceGroupLaneMountData>>,
  resourceGroupLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupLaneMountData>>,

  // timeline, lane, for resource
  resourceLaneClassNames: identity as Identity<ClassNamesGenerator<ResourceLaneData>>,
  resourceLaneContent: identity as Identity<CustomContentGenerator<ResourceLaneData>>,
  resourceLaneDidMount: identity as Identity<DidMountHandler<ResourceLaneMountData>>,
  resourceLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceLaneMountData>>,
  resourceLaneTopClassNames: identity as Identity<ClassNamesInput>,
  resourceLaneBottomClassNames: identity as Identity<ClassNamesGenerator<{ isCompact: boolean }>>,
  resourceAreaDividerClassNames: identity as Identity<ClassNamesInput>,

  resourceIndentClassNames: identity as Identity<ClassNamesInput>,
  resourceExpanderClassNames: identity as Identity<ClassNamesGenerator<ResourceExpanderData>>,
  resourceExpanderContent: identity as Identity<CustomContentGenerator<ResourceExpanderData>>,
}

type ResourceTimelineOptionRefiners = typeof OPTION_REFINERS
export type ResourceTimelineOptions = RawOptionsFromRefiners<ResourceTimelineOptionRefiners>
export type ResourceTimelineOptionsRefined = RefinedOptionsFromRefiners<ResourceTimelineOptionRefiners>
