import { RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/core/protected-api'
import type { ClassNameGenerator, CssDimValue } from '@fullcalendar/preact/public-api'
import {
  ContentGenerator,
  DidMountHandler,
  Identity,
  WillUnmountHandler,
  identity,
  parseFieldSpecs,
  refineClassName,
  refineClassNameGenerator,
} from '@fullcalendar/preact/protected-api'
import type { ResourceSourceInput } from '../resource/structs/resource-source-parse'
import type { ResourceApi } from '../resource/api/ResourceApi'
import type { ResourceAddInfo, ResourceChangeInfo, ResourceRemoveInfo } from '../resource/resources-crud'
import type { ResourceDayHeaderInfo } from '../resource-daygrid/structs'
import type {
  ColSpec,
  ResourceCellInfo,
  ResourceColumnHeaderInfo,
  ResourceExpanderInfo,
  ResourceGroupHeaderInfo,
  ResourceGroupLaneInfo,
  ResourceLaneInfo,
} from '../resource-timeline/structs'

export const OPTION_REFINERS = {
  // Premium Common
  // --------------

  schedulerLicenseKey: String,
  virtualization: Boolean,

  // Resource
  // --------

  initialResources: identity as Identity<ResourceSourceInput>,
  resources: identity as Identity<ResourceSourceInput>,

  eventResourceEditable: Boolean,
  refetchResourcesOnNavigate: Boolean,
  resourceOrder: parseFieldSpecs,
  filterResourcesWithEvents: Boolean,
  resourceGroupField: String,

  resourcesInitiallyExpanded: Boolean,
  datesAboveResources: Boolean,
  needsResourceData: Boolean, // internal-only

  // Resource DayGrid
  // ----------------

  resourceDayHeaderClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceDayHeaderInfo>>,
  resourceDayHeaderInnerClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceDayHeaderInfo>>,
  resourceDayHeaderContent: identity as Identity<ContentGenerator<ResourceDayHeaderInfo>>,
  resourceDayHeaderDidMount: identity as Identity<DidMountHandler<ResourceDayHeaderInfo>>,
  resourceDayHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceDayHeaderInfo>>,
  resourceDayHeaderAlign: identity as Identity<'start' | 'center' | 'end' | ((info: { level: number }) => 'start' | 'center' | 'end')>,
  // stickiness for cell-inner-contents laterally. experimental settings
  _resourceDayHeaderSticky: identity as Identity<boolean | number | string>,

  // Resource Timeline
  // -----------------

  printMaxRows: Number,
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

  // Timeline
  // --------

  timelineTopClass: refineClassName,
  timelineBottomClass: refineClassName,
}

export type PremiumOptions = RawOptionsFromRefiners<typeof OPTION_REFINERS>
export type PremiumOptionsRefined = RefinedOptionsFromRefiners<typeof OPTION_REFINERS>

export const OPTION_DEFAULTS = {
  // Resource Timeline
  // -----------------

  printMaxRows: 1000,

  // Resource DayGrid
  // ----------------

  // resourceDayHeaderAlign: 'start' as const, --- this default was inlined due to plugin ordering problems
  _resourceDayHeaderSticky: true,
}

export const LISTENER_REFINERS = {
  // Resource
  // --------

  resourcesSet: identity as Identity<(resources: ResourceApi[]) => void>,
  resourceAdd: identity as Identity<(info: ResourceAddInfo) => void>,
  resourceChange: identity as Identity<(info: ResourceChangeInfo) => void>,
  resourceRemove: identity as Identity<(info: ResourceRemoveInfo) => void>,

  // internal
  _resourceScrollRequest: identity as Identity<(resourceId: string) => void>,
}

export type PremiumListeners = RawOptionsFromRefiners<typeof LISTENER_REFINERS>
export type PremiumListenersRefined = RefinedOptionsFromRefiners<typeof LISTENER_REFINERS>
