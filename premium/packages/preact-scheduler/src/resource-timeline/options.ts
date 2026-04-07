import { RefinedOptionsFromRefiners, RawOptionsFromRefiners } from '@fullcalendar/core/protected-api'
import { ClassNameGenerator, CssDimValue } from '@fullcalendar/preact/public-api'
import {
  Identity, identity,
  CustomContentGenerator, DidMountHandler, WillUnmountHandler,
} from '@fullcalendar/preact/protected-api'
import {
  ResourceColumnHeaderData,
  ResourceCellData,
  ResourceGroupHeaderData,
  ResourceGroupLaneData,
  ResourceLaneData,
  ColSpec,
  ResourceExpanderData,
} from './structs'

export const OPTION_REFINERS = {
  resourceColumnsWidth: identity as Identity<CssDimValue>,
  resourceColumns: identity as Identity<ColSpec[]>,

  resourceColumnDividerClass: identity as Identity<string | undefined>,

  // datagrid super-header & normal column headers
  resourceColumnHeaderClass: identity as Identity<ClassNameGenerator<ResourceColumnHeaderData>>,
  resourceColumnHeaderInnerClass: identity as Identity<ClassNameGenerator<ResourceColumnHeaderData>>,
  resourceColumnResizerClass: identity as Identity<ClassNameGenerator<ResourceColumnHeaderData>>,
  resourceColumnHeaderContent: identity as Identity<CustomContentGenerator<ResourceColumnHeaderData>>,
  resourceColumnHeaderDidMount: identity as Identity<DidMountHandler<ResourceColumnHeaderData>>,
  resourceColumnHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceColumnHeaderData>>,
  resourceHeaderRowClass: identity as Identity<string | undefined>,

  // For both resources & resource groups
  resourceRowClass: identity as Identity<string | undefined>,

  // datagrid cells, for both resources & resource-GROUP
  resourceCellClass: identity as Identity<ClassNameGenerator<ResourceCellData>>,
  resourceCellInnerClass: identity as Identity<ClassNameGenerator<ResourceCellData>>,
  resourceCellContent: identity as Identity<CustomContentGenerator<ResourceCellData>>,
  resourceCellDidMount: identity as Identity<DidMountHandler<ResourceCellData>>,
  resourceCellWillUnmount: identity as Identity<WillUnmountHandler<ResourceCellData>>,

  // datagrid, for resource-GROUP entire row
  resourceGroupHeaderClass: identity as Identity<ClassNameGenerator<ResourceGroupHeaderData>>,
  resourceGroupHeaderInnerClass: identity as Identity<ClassNameGenerator<ResourceGroupHeaderData>>,
  resourceGroupHeaderContent: identity as Identity<CustomContentGenerator<ResourceGroupHeaderData>>,
  resourceGroupHeaderDidMount: identity as Identity<DidMountHandler<ResourceGroupHeaderData>>,
  resourceGroupHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupHeaderData>>,

  // timeline lane, for resource-GROUP
  resourceGroupLaneClass: identity as Identity<ClassNameGenerator<ResourceGroupLaneData>>,
  resourceGroupLaneInnerClass: identity as Identity<ClassNameGenerator<ResourceGroupLaneData>>,
  resourceGroupLaneContent: identity as Identity<CustomContentGenerator<ResourceGroupLaneData>>,
  resourceGroupLaneDidMount: identity as Identity<DidMountHandler<ResourceGroupLaneData>>,
  resourceGroupLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupLaneData>>,

  // timeline, lane, for resource
  resourceLaneClass: identity as Identity<ClassNameGenerator<ResourceLaneData>>,
  resourceLaneDidMount: identity as Identity<DidMountHandler<ResourceLaneData>>,
  resourceLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceLaneData>>,
  resourceLaneTopClass: identity as Identity<ClassNameGenerator<ResourceLaneData>>,
  resourceLaneTopContent: identity as Identity<CustomContentGenerator<ResourceLaneData>>,
  resourceLaneBottomClass: identity as Identity<ClassNameGenerator<ResourceLaneData>>,
  resourceLaneBottomContent: identity as Identity<CustomContentGenerator<ResourceLaneData>>,

  resourceIndentClass: identity as Identity<string | undefined>,
  resourceExpanderClass: identity as Identity<ClassNameGenerator<ResourceExpanderData>>,
  resourceExpanderContent: identity as Identity<CustomContentGenerator<ResourceExpanderData>>,
}

type ResourceTimelineOptionRefiners = typeof OPTION_REFINERS
export type ResourceTimelineOptions = RawOptionsFromRefiners<ResourceTimelineOptionRefiners>
export type ResourceTimelineOptionsRefined = RefinedOptionsFromRefiners<ResourceTimelineOptionRefiners>
