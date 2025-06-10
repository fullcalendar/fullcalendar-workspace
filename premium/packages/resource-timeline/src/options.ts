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
  resourceAreaHeaderClass: identity as Identity<ClassNamesGenerator<ResourceColumnHeaderData>>,
  resourceAreaHeaderInnerClass: identity as Identity<ClassNamesGenerator<ResourceColumnHeaderData>>,
  resourceAreaHeaderContent: identity as Identity<CustomContentGenerator<ResourceColumnHeaderData>>,
  resourceAreaHeaderDidMount: identity as Identity<DidMountHandler<ResourceColumnHeaderMountData>>,
  resourceAreaHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceColumnHeaderMountData>>,
  resourceAreaHeaderRowClass: identity as Identity<ClassNamesInput>, // between super-header and normal headers
  resourceAreaRowClass: identity as Identity<ClassNamesInput>,

  // datagrid cells, for both resources & resource-GROUP
  resourceCellClass: identity as Identity<ClassNamesGenerator<ResourceCellData>>,
  resourceCellInnerClass: identity as Identity<ClassNamesGenerator<ResourceCellData>>,
  resourceCellContent: identity as Identity<CustomContentGenerator<ResourceCellData>>,
  resourceCellDidMount: identity as Identity<DidMountHandler<ResourceCellMountData>>,
  resourceCellWillUnmount: identity as Identity<WillUnmountHandler<ResourceCellMountData>>,

  // datagrid, for resource-GROUP entire row
  resourceGroupHeaderClass: identity as Identity<ClassNamesGenerator<ResourceGroupHeaderData>>,
  resourceGroupHeaderInnerClass: identity as Identity<ClassNamesGenerator<ResourceGroupHeaderData>>,
  resourceGroupHeaderContent: identity as Identity<CustomContentGenerator<ResourceGroupHeaderData>>,
  resourceGroupHeaderDidMount: identity as Identity<DidMountHandler<ResourceGroupHeaderMountData>>,
  resourceGroupHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupHeaderMountData>>,

  // timeline lane, for resource-GROUP
  resourceGroupLaneClass: identity as Identity<ClassNamesGenerator<ResourceGroupLaneData>>,
  resourceGroupLaneInnerClass: identity as Identity<ClassNamesGenerator<ResourceGroupLaneData>>,
  resourceGroupLaneContent: identity as Identity<CustomContentGenerator<ResourceGroupLaneData>>,
  resourceGroupLaneDidMount: identity as Identity<DidMountHandler<ResourceGroupLaneMountData>>,
  resourceGroupLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupLaneMountData>>,

  // timeline, lane, for resource
  resourceLaneClass: identity as Identity<ClassNamesGenerator<ResourceLaneData>>,
  resourceLaneContent: identity as Identity<CustomContentGenerator<ResourceLaneData>>,
  resourceLaneDidMount: identity as Identity<DidMountHandler<ResourceLaneMountData>>,
  resourceLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceLaneMountData>>,
  resourceLaneTopClass: identity as Identity<ClassNamesInput>,
  resourceLaneBottomClass: identity as Identity<ClassNamesGenerator<{ isCompact: boolean }>>,
  resourceAreaDividerClass: identity as Identity<ClassNamesInput>,

  resourceIndentClass: identity as Identity<ClassNamesInput>,
  resourceExpanderClass: identity as Identity<ClassNamesGenerator<ResourceExpanderData>>,
  resourceExpanderContent: identity as Identity<CustomContentGenerator<ResourceExpanderData>>,
}

type ResourceTimelineOptionRefiners = typeof OPTION_REFINERS
export type ResourceTimelineOptions = RawOptionsFromRefiners<ResourceTimelineOptionRefiners>
export type ResourceTimelineOptionsRefined = RefinedOptionsFromRefiners<ResourceTimelineOptionRefiners>
