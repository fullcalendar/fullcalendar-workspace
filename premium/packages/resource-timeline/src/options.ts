import { ClassNameGenerator, ClassNameInput, CssDimValue } from '@fullcalendar/core'
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
  resourceColumnsWidth: identity as Identity<CssDimValue>,
  resourceColumns: identity as Identity<ColSpec[]>,

  resourceColumnDividerClass: identity as Identity<ClassNameInput>,

  // datagrid super-header & normal column headers
  resourceColumnHeaderClass: identity as Identity<ClassNameGenerator<ResourceColumnHeaderData>>,
  resourceColumnHeaderInnerClass: identity as Identity<ClassNameGenerator<ResourceColumnHeaderData>>,
  resourceColumnResizerClass: identity as Identity<ClassNameGenerator<ResourceColumnHeaderData>>,
  resourceColumnHeaderContent: identity as Identity<CustomContentGenerator<ResourceColumnHeaderData>>,
  resourceColumnHeaderDidMount: identity as Identity<DidMountHandler<ResourceColumnHeaderMountData>>,
  resourceColumnHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceColumnHeaderMountData>>,
  resourceHeaderRowClass: identity as Identity<ClassNameInput>,

  // For both resources & resource groups
  resourceRowClass: identity as Identity<ClassNameInput>,

  // datagrid cells, for both resources & resource-GROUP
  resourceCellClass: identity as Identity<ClassNameGenerator<ResourceCellData>>,
  resourceCellInnerClass: identity as Identity<ClassNameGenerator<ResourceCellData>>,
  resourceCellContent: identity as Identity<CustomContentGenerator<ResourceCellData>>,
  resourceCellDidMount: identity as Identity<DidMountHandler<ResourceCellMountData>>,
  resourceCellWillUnmount: identity as Identity<WillUnmountHandler<ResourceCellMountData>>,

  // datagrid, for resource-GROUP entire row
  resourceGroupHeaderClass: identity as Identity<ClassNameGenerator<ResourceGroupHeaderData>>,
  resourceGroupHeaderInnerClass: identity as Identity<ClassNameGenerator<ResourceGroupHeaderData>>,
  resourceGroupHeaderContent: identity as Identity<CustomContentGenerator<ResourceGroupHeaderData>>,
  resourceGroupHeaderDidMount: identity as Identity<DidMountHandler<ResourceGroupHeaderMountData>>,
  resourceGroupHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupHeaderMountData>>,

  // timeline lane, for resource-GROUP
  resourceGroupLaneClass: identity as Identity<ClassNameGenerator<ResourceGroupLaneData>>,
  resourceGroupLaneInnerClass: identity as Identity<ClassNameGenerator<ResourceGroupLaneData>>,
  resourceGroupLaneContent: identity as Identity<CustomContentGenerator<ResourceGroupLaneData>>,
  resourceGroupLaneDidMount: identity as Identity<DidMountHandler<ResourceGroupLaneMountData>>,
  resourceGroupLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupLaneMountData>>,

  // timeline, lane, for resource
  resourceLaneClass: identity as Identity<ClassNameGenerator<ResourceLaneData>>,
  resourceLaneDidMount: identity as Identity<DidMountHandler<ResourceLaneMountData>>,
  resourceLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceLaneMountData>>,
  resourceLaneTopClass: identity as Identity<ClassNameGenerator<ResourceLaneData>>,
  resourceLaneTopContent: identity as Identity<CustomContentGenerator<ResourceLaneData>>,
  resourceLaneBottomClass: identity as Identity<ClassNameGenerator<ResourceLaneData>>,
  resourceLaneBottomContent: identity as Identity<CustomContentGenerator<ResourceLaneData>>,

  resourceIndentClass: identity as Identity<ClassNameInput>,
  resourceExpanderClass: identity as Identity<ClassNameGenerator<ResourceExpanderData>>,
  resourceExpanderContent: identity as Identity<CustomContentGenerator<ResourceExpanderData>>,
}

type ResourceTimelineOptionRefiners = typeof OPTION_REFINERS
export type ResourceTimelineOptions = RawOptionsFromRefiners<ResourceTimelineOptionRefiners>
export type ResourceTimelineOptionsRefined = RefinedOptionsFromRefiners<ResourceTimelineOptionRefiners>
