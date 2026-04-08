import { RefinedOptionsFromRefiners, RawOptionsFromRefiners } from '@fullcalendar/core/protected-api'
import { ClassNameGenerator, CssDimValue } from '@fullcalendar/preact/public-api'
import {
  Identity, identity,
  CustomContentGenerator, DidMountHandler, WillUnmountHandler,
} from '@fullcalendar/preact/protected-api'
import {
  ResourceColumnHeaderInfo,
  ResourceCellInfo,
  ResourceGroupHeaderInfo,
  ResourceGroupLaneInfo,
  ResourceLaneInfo,
  ColSpec,
  ResourceExpanderInfo,
} from './structs'

export const OPTION_REFINERS = {
  resourceColumnsWidth: identity as Identity<CssDimValue>,
  resourceColumns: identity as Identity<ColSpec[]>,

  resourceColumnDividerClass: identity as Identity<string | undefined>,

  // datagrid super-header & normal column headers
  resourceColumnHeaderClass: identity as Identity<ClassNameGenerator<ResourceColumnHeaderInfo>>,
  resourceColumnHeaderInnerClass: identity as Identity<ClassNameGenerator<ResourceColumnHeaderInfo>>,
  resourceColumnResizerClass: identity as Identity<ClassNameGenerator<ResourceColumnHeaderInfo>>,
  resourceColumnHeaderContent: identity as Identity<CustomContentGenerator<ResourceColumnHeaderInfo>>,
  resourceColumnHeaderDidMount: identity as Identity<DidMountHandler<ResourceColumnHeaderInfo>>,
  resourceColumnHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceColumnHeaderInfo>>,
  resourceHeaderRowClass: identity as Identity<string | undefined>,

  // For both resources & resource groups
  resourceRowClass: identity as Identity<string | undefined>,

  // datagrid cells, for both resources & resource-GROUP
  resourceCellClass: identity as Identity<ClassNameGenerator<ResourceCellInfo>>,
  resourceCellInnerClass: identity as Identity<ClassNameGenerator<ResourceCellInfo>>,
  resourceCellContent: identity as Identity<CustomContentGenerator<ResourceCellInfo>>,
  resourceCellDidMount: identity as Identity<DidMountHandler<ResourceCellInfo>>,
  resourceCellWillUnmount: identity as Identity<WillUnmountHandler<ResourceCellInfo>>,

  // datagrid, for resource-GROUP entire row
  resourceGroupHeaderClass: identity as Identity<ClassNameGenerator<ResourceGroupHeaderInfo>>,
  resourceGroupHeaderInnerClass: identity as Identity<ClassNameGenerator<ResourceGroupHeaderInfo>>,
  resourceGroupHeaderContent: identity as Identity<CustomContentGenerator<ResourceGroupHeaderInfo>>,
  resourceGroupHeaderDidMount: identity as Identity<DidMountHandler<ResourceGroupHeaderInfo>>,
  resourceGroupHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupHeaderInfo>>,

  // timeline lane, for resource-GROUP
  resourceGroupLaneClass: identity as Identity<ClassNameGenerator<ResourceGroupLaneInfo>>,
  resourceGroupLaneInnerClass: identity as Identity<ClassNameGenerator<ResourceGroupLaneInfo>>,
  resourceGroupLaneContent: identity as Identity<CustomContentGenerator<ResourceGroupLaneInfo>>,
  resourceGroupLaneDidMount: identity as Identity<DidMountHandler<ResourceGroupLaneInfo>>,
  resourceGroupLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupLaneInfo>>,

  // timeline, lane, for resource
  resourceLaneClass: identity as Identity<ClassNameGenerator<ResourceLaneInfo>>,
  resourceLaneDidMount: identity as Identity<DidMountHandler<ResourceLaneInfo>>,
  resourceLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceLaneInfo>>,
  resourceLaneTopClass: identity as Identity<ClassNameGenerator<ResourceLaneInfo>>,
  resourceLaneTopContent: identity as Identity<CustomContentGenerator<ResourceLaneInfo>>,
  resourceLaneBottomClass: identity as Identity<ClassNameGenerator<ResourceLaneInfo>>,
  resourceLaneBottomContent: identity as Identity<CustomContentGenerator<ResourceLaneInfo>>,

  resourceIndentClass: identity as Identity<string | undefined>,
  resourceExpanderClass: identity as Identity<ClassNameGenerator<ResourceExpanderInfo>>,
  resourceExpanderContent: identity as Identity<CustomContentGenerator<ResourceExpanderInfo>>,
}

type ResourceTimelineOptionRefiners = typeof OPTION_REFINERS
export type ResourceTimelineOptions = RawOptionsFromRefiners<ResourceTimelineOptionRefiners>
export type ResourceTimelineOptionsRefined = RefinedOptionsFromRefiners<ResourceTimelineOptionRefiners>
