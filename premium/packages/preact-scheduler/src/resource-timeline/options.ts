import { RefinedOptionsFromRefiners, RawOptionsFromRefiners } from '@fullcalendar/core/protected-api'
import { ClassNameGenerator, CssDimValue } from '@fullcalendar/preact/public-api'
import {
  Identity, identity,
  ContentGenerator, DidMountHandler, WillUnmountHandler,
  refineClassName, refineClassNameGenerator,
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

  resourceColumnDividerClass: refineClassName,

  // datagrid super-header & normal column headers
  resourceColumnHeaderClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceColumnHeaderInfo>>,
  resourceColumnHeaderInnerClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceColumnHeaderInfo>>,
  resourceColumnResizerClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceColumnHeaderInfo>>,
  resourceColumnHeaderContent: identity as Identity<ContentGenerator<ResourceColumnHeaderInfo>>,
  resourceColumnHeaderDidMount: identity as Identity<DidMountHandler<ResourceColumnHeaderInfo>>,
  resourceColumnHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceColumnHeaderInfo>>,
  resourceHeaderRowClass: refineClassName,

  // For both resources & resource groups
  resourceRowClass: refineClassName,

  // datagrid cells, for both resources & resource-GROUP
  resourceCellClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceCellInfo>>,
  resourceCellInnerClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceCellInfo>>,
  resourceCellContent: identity as Identity<ContentGenerator<ResourceCellInfo>>,
  resourceCellDidMount: identity as Identity<DidMountHandler<ResourceCellInfo>>,
  resourceCellWillUnmount: identity as Identity<WillUnmountHandler<ResourceCellInfo>>,

  // datagrid, for resource-GROUP entire row
  resourceGroupHeaderClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceGroupHeaderInfo>>,
  resourceGroupHeaderInnerClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceGroupHeaderInfo>>,
  resourceGroupHeaderContent: identity as Identity<ContentGenerator<ResourceGroupHeaderInfo>>,
  resourceGroupHeaderDidMount: identity as Identity<DidMountHandler<ResourceGroupHeaderInfo>>,
  resourceGroupHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupHeaderInfo>>,

  // timeline lane, for resource-GROUP
  resourceGroupLaneClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceGroupLaneInfo>>,
  resourceGroupLaneInnerClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceGroupLaneInfo>>,
  resourceGroupLaneContent: identity as Identity<ContentGenerator<ResourceGroupLaneInfo>>,
  resourceGroupLaneDidMount: identity as Identity<DidMountHandler<ResourceGroupLaneInfo>>,
  resourceGroupLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupLaneInfo>>,

  // timeline, lane, for resource
  resourceLaneClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceLaneInfo>>,
  resourceLaneDidMount: identity as Identity<DidMountHandler<ResourceLaneInfo>>,
  resourceLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceLaneInfo>>,
  resourceLaneTopClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceLaneInfo>>,
  resourceLaneTopContent: identity as Identity<ContentGenerator<ResourceLaneInfo>>,
  resourceLaneBottomClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceLaneInfo>>,
  resourceLaneBottomContent: identity as Identity<ContentGenerator<ResourceLaneInfo>>,

  resourceIndentClass: refineClassName,
  resourceExpanderClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceExpanderInfo>>,
  resourceExpanderContent: identity as Identity<ContentGenerator<ResourceExpanderInfo>>,
}

type ResourceTimelineOptionRefiners = typeof OPTION_REFINERS
export type ResourceTimelineOptions = RawOptionsFromRefiners<ResourceTimelineOptionRefiners>
export type ResourceTimelineOptionsRefined = RefinedOptionsFromRefiners<ResourceTimelineOptionRefiners>
