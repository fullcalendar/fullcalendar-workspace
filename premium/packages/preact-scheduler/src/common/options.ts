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

  /**
   * The license key that unlocks premium features. Without a valid key, premium views display a
   * license warning.
   * @see https://fullcalendar.io/docs/schedulerLicenseKey
   */
  schedulerLicenseKey: String,

  /**
   * Whether to render only the rows and columns visible in the scroll viewport, which speeds up
   * calendars with many resources. Currently applies to resource timeline views.
   * @see https://fullcalendar.io/docs/virtualization
   */
  virtualization: Boolean,

  // Resource
  // --------

  /**
   * Resources to load when the calendar initializes, in any form `resources` accepts. Unlike
   * `resources`, later changes to this value are ignored, so resources can then be managed through
   * the API.
   * @see https://fullcalendar.io/docs/initialResources
   */
  initialResources: identity as Identity<ResourceSourceInput>,

  /**
   * The calendar's resources: an array of resource objects, a JSON feed URL, a function that supplies
   * resources, or a resource source object.
   * @see https://fullcalendar.io/docs/resource-data
   */
  resources: identity as Identity<ResourceSourceInput>,

  /**
   * Whether the user can drag events from one resource to another. Defaults to the value of
   * `editable`; requires the interaction plugin.
   * @see https://fullcalendar.io/docs/eventResourceEditable
   */
  eventResourceEditable: Boolean,

  /**
   * Whether to refetch resources whenever the date range or view changes. When `true`, resource feeds
   * and functions receive the start, end, and time zone of the range.
   * @see https://fullcalendar.io/docs/refetchResourcesOnNavigate
   */
  refetchResourcesOnNavigate: Boolean,

  /**
   * The sort order of resources: resource field names (prefix with `-` for descending) as a
   * comma-separated string or array, or a comparison function. Defaults to `'id,title'`.
   * @see https://fullcalendar.io/docs/resourceOrder
   */
  resourceOrder: parseFieldSpecs,

  /**
   * Whether to display only resources that have events in the current date range. No resources
   * appear until events have loaded.
   * @see https://fullcalendar.io/docs/filterResourcesWithEvents
   */
  filterResourcesWithEvents: Boolean,

  /**
   * In resource timeline views, groups resources by the value of this resource field, with a
   * header row above each group. Ignored if any `resourceColumns` entry has `group: true`.
   * @see https://fullcalendar.io/docs/resourceGroupField
   */
  resourceGroupField: String,

  /**
   * Whether child resources start out expanded in resource timeline views. When `false`, they are
   * collapsed until the user expands their parent.
   * @see https://fullcalendar.io/docs/resourcesInitiallyExpanded
   */
  resourcesInitiallyExpanded: Boolean,

  /**
   * Whether vertical resource views put the date headers above the resource headers, instead of
   * resources above dates.
   * @see https://fullcalendar.io/docs/datesAboveResources
   */
  datesAboveResources: Boolean,

  needsResourceData: Boolean, // internal-only

  // Resource DayGrid
  // ----------------

  /**
   * Class names for a header cell naming one resource, above its column(s) in resource time grid and
   * day grid views. A string, or a function that receives `ResourceDayHeaderInfo` and returns one.
   * @see https://fullcalendar.io/docs/resource-day-header-render-hooks
   */
  resourceDayHeaderClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceDayHeaderInfo>>,

  /**
   * Class names for the text wrapper inside a resource header cell. A string, or a function that
   * receives `ResourceDayHeaderInfo` and returns one.
   * @see https://fullcalendar.io/docs/resource-day-header-render-hooks
   */
  resourceDayHeaderInnerClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceDayHeaderInfo>>,

  /**
   * Custom content for each `resourceDayHeader` part, injected inside it in place of its default
   * content.
   * @see https://fullcalendar.io/docs/resource-day-header-render-hooks
   */
  resourceDayHeaderContent: identity as Identity<ContentGenerator<ResourceDayHeaderInfo>>,

  /**
   * Called right after each `resourceDayHeader` part's element is added to the DOM.
   * @see https://fullcalendar.io/docs/resource-day-header-render-hooks
   */
  resourceDayHeaderDidMount: identity as Identity<DidMountHandler<ResourceDayHeaderInfo>>,

  /**
   * Called right before each `resourceDayHeader` part's element is removed from the DOM.
   * @see https://fullcalendar.io/docs/resource-day-header-render-hooks
   */
  resourceDayHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceDayHeaderInfo>>,

  /**
   * The horizontal alignment of resource header text: `'start'`, `'center'`, or `'end'`, or a
   * function of the header's `level` that returns one. Themes set their own default.
   * @see https://fullcalendar.io/docs/resource-day-header-render-hooks
   */
  resourceDayHeaderAlign: identity as Identity<'start' | 'center' | 'end' | ((info: { level: number }) => 'start' | 'center' | 'end')>,

  // stickiness for cell-inner-contents laterally. experimental settings
  _resourceDayHeaderSticky: identity as Identity<boolean | number | string>,

  // Resource Timeline
  // -----------------

  /**
   * The maximum number of resource rows rendered when printing a resource timeline view. Printing
   * requires the premium adaptive plugin.
   * @see https://fullcalendar.io/docs/printMaxRows
   */
  printMaxRows: Number,

  /**
   * The width of the resource area in resource timeline views, as a number of pixels or a string
   * ending in `px` or `%`. Defaults to `'30%'`.
   * @see https://fullcalendar.io/docs/resourceColumnsWidth
   */
  resourceColumnsWidth: identity as Identity<CssDimValue>,

  /**
   * Turns the resource area of resource timeline views into a grid of data columns. An array of
   * column objects, each typically with a `field` from the resource, and optionally a
   * `headerContent`, `width`, or `group: true`.
   * @see https://fullcalendar.io/docs/resourceColumns
   */
  resourceColumns: identity as Identity<ColSpec[]>,

  /**
   * Class names for the line between the resource area and the timeline. A string only; functions are
   * not accepted.
   * @see https://fullcalendar.io/docs/resource-column-divider-render-hooks
   */
  resourceColumnDividerClass: refineClassName,

  // datagrid super-header & normal column headers
  /**
   * Class names for the header of one resource area column ("Resources" by default). A string, or a
   * function that receives `ResourceColumnHeaderInfo` and returns one.
   * @see https://fullcalendar.io/docs/resource-column-header-render-hooks
   */
  resourceColumnHeaderClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceColumnHeaderInfo>>,

  /**
   * Class names for the text wrapper inside a resource column header. A string, or a function that
   * receives `ResourceColumnHeaderInfo` and returns one.
   * @see https://fullcalendar.io/docs/resource-column-header-render-hooks
   */
  resourceColumnHeaderInnerClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceColumnHeaderInfo>>,

  /**
   * Class names for the drag handle for resizing a resource area column. A string, or a function that
   * receives `ResourceColumnHeaderInfo` and returns one.
   * @see https://fullcalendar.io/docs/resource-column-header-render-hooks
   */
  resourceColumnResizerClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceColumnHeaderInfo>>,

  /**
   * Custom content for each `resourceColumnHeader` part, injected inside it in place of its default
   * content.
   * @see https://fullcalendar.io/docs/resource-column-header-render-hooks
   */
  resourceColumnHeaderContent: identity as Identity<ContentGenerator<ResourceColumnHeaderInfo>>,

  /**
   * Called right after each `resourceColumnHeader` part's element is added to the DOM.
   * @see https://fullcalendar.io/docs/resource-column-header-render-hooks
   */
  resourceColumnHeaderDidMount: identity as Identity<DidMountHandler<ResourceColumnHeaderInfo>>,

  /**
   * Called right before each `resourceColumnHeader` part's element is removed from the DOM.
   * @see https://fullcalendar.io/docs/resource-column-header-render-hooks
   */
  resourceColumnHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceColumnHeaderInfo>>,

  /**
   * Class names for a header row of the resource area, on the left of resource timeline views. A string
   * only; functions are not accepted.
   * @see https://fullcalendar.io/docs/resource-header-row-render-hooks
   */
  resourceHeaderRowClass: refineClassName,

  // For both resources & resource groups
  /**
   * Class names for a row in the resource area, for a resource or a resource group. A string only;
   * functions are not accepted.
   * @see https://fullcalendar.io/docs/resource-row-render-hooks
   */
  resourceRowClass: refineClassName,

  // datagrid cells, for both resources & resource-GROUP
  /**
   * Class names for one cell of a resource row: the resource's title or another column's field. A
   * string, or a function that receives `ResourceCellInfo` and returns one.
   * @see https://fullcalendar.io/docs/resource-cell-render-hooks
   */
  resourceCellClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceCellInfo>>,

  /**
   * Class names for the content wrapper inside a resource cell. A string, or a function that receives
   * `ResourceCellInfo` and returns one.
   * @see https://fullcalendar.io/docs/resource-cell-render-hooks
   */
  resourceCellInnerClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceCellInfo>>,

  /**
   * Custom content for each `resourceCell` part, injected inside it in place of its default content.
   * @see https://fullcalendar.io/docs/resource-cell-render-hooks
   */
  resourceCellContent: identity as Identity<ContentGenerator<ResourceCellInfo>>,

  /**
   * Called right after each `resourceCell` part's element is added to the DOM.
   * @see https://fullcalendar.io/docs/resource-cell-render-hooks
   */
  resourceCellDidMount: identity as Identity<DidMountHandler<ResourceCellInfo>>,

  /**
   * Called right before each `resourceCell` part's element is removed from the DOM.
   * @see https://fullcalendar.io/docs/resource-cell-render-hooks
   */
  resourceCellWillUnmount: identity as Identity<WillUnmountHandler<ResourceCellInfo>>,

  // datagrid, for resource-GROUP entire row
  /**
   * Class names for the name of a resource group, at the top of its rows in the resource area. A
   * string, or a function that receives `ResourceGroupHeaderInfo` and returns one.
   * @see https://fullcalendar.io/docs/resource-group-header-render-hooks
   */
  resourceGroupHeaderClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceGroupHeaderInfo>>,

  /**
   * Class names for the text wrapper inside a resource group header. A string, or a function that
   * receives `ResourceGroupHeaderInfo` and returns one.
   * @see https://fullcalendar.io/docs/resource-group-header-render-hooks
   */
  resourceGroupHeaderInnerClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceGroupHeaderInfo>>,

  /**
   * Custom content for each `resourceGroupHeader` part, injected inside it in place of its default
   * content.
   * @see https://fullcalendar.io/docs/resource-group-header-render-hooks
   */
  resourceGroupHeaderContent: identity as Identity<ContentGenerator<ResourceGroupHeaderInfo>>,

  /**
   * Called right after each `resourceGroupHeader` part's element is added to the DOM.
   * @see https://fullcalendar.io/docs/resource-group-header-render-hooks
   */
  resourceGroupHeaderDidMount: identity as Identity<DidMountHandler<ResourceGroupHeaderInfo>>,

  /**
   * Called right before each `resourceGroupHeader` part's element is removed from the DOM.
   * @see https://fullcalendar.io/docs/resource-group-header-render-hooks
   */
  resourceGroupHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupHeaderInfo>>,

  // timeline lane, for resource-GROUP
  /**
   * Class names for a resource group's lane across the timeline, beside its header. A string, or a
   * function that receives `ResourceGroupLaneInfo` and returns one.
   * @see https://fullcalendar.io/docs/resource-group-lane-render-hooks
   */
  resourceGroupLaneClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceGroupLaneInfo>>,

  /**
   * Class names for the wrapper inside a resource group lane. A string, or a function that receives
   * `ResourceGroupLaneInfo` and returns one.
   * @see https://fullcalendar.io/docs/resource-group-lane-render-hooks
   */
  resourceGroupLaneInnerClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceGroupLaneInfo>>,

  /**
   * Content rendered inside each `resourceGroupLane` part, which is otherwise empty.
   * @see https://fullcalendar.io/docs/resource-group-lane-render-hooks
   */
  resourceGroupLaneContent: identity as Identity<ContentGenerator<ResourceGroupLaneInfo>>,

  /**
   * Called right after each `resourceGroupLane` part's element is added to the DOM.
   * @see https://fullcalendar.io/docs/resource-group-lane-render-hooks
   */
  resourceGroupLaneDidMount: identity as Identity<DidMountHandler<ResourceGroupLaneInfo>>,

  /**
   * Called right before each `resourceGroupLane` part's element is removed from the DOM.
   * @see https://fullcalendar.io/docs/resource-group-lane-render-hooks
   */
  resourceGroupLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceGroupLaneInfo>>,

  // timeline, lane, for resource
  /**
   * Class names for one resource's horizontal lane across the timeline, where its events appear. A
   * string, or a function that receives `ResourceLaneInfo` and returns one.
   * @see https://fullcalendar.io/docs/resource-lane-render-hooks
   */
  resourceLaneClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceLaneInfo>>,

  /**
   * Called right after each `resourceLane` part's element is added to the DOM.
   * @see https://fullcalendar.io/docs/resource-lane-render-hooks
   */
  resourceLaneDidMount: identity as Identity<DidMountHandler<ResourceLaneInfo>>,

  /**
   * Called right before each `resourceLane` part's element is removed from the DOM.
   * @see https://fullcalendar.io/docs/resource-lane-render-hooks
   */
  resourceLaneWillUnmount: identity as Identity<WillUnmountHandler<ResourceLaneInfo>>,

  /**
   * Class names for the space above the events in a resource lane. A string, or a function that
   * receives `ResourceLaneInfo` and returns one.
   * @see https://fullcalendar.io/docs/resource-lane-render-hooks
   */
  resourceLaneTopClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceLaneInfo>>,

  /**
   * Content rendered inside each resource lane's `resourceLaneTop` element, above its events, which
   * is otherwise empty.
   * @see https://fullcalendar.io/docs/resource-lane-render-hooks
   */
  resourceLaneTopContent: identity as Identity<ContentGenerator<ResourceLaneInfo>>,

  /**
   * Class names for the space below the events in a resource lane. A string, or a function that
   * receives `ResourceLaneInfo` and returns one.
   * @see https://fullcalendar.io/docs/resource-lane-render-hooks
   */
  resourceLaneBottomClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceLaneInfo>>,

  /**
   * Content rendered inside each resource lane's `resourceLaneBottom` element, below its events,
   * which is otherwise empty.
   * @see https://fullcalendar.io/docs/resource-lane-render-hooks
   */
  resourceLaneBottomContent: identity as Identity<ContentGenerator<ResourceLaneInfo>>,

  /**
   * Class names for the indentation before a nested resource, holding the expander. A string only;
   * functions are not accepted.
   * @see https://fullcalendar.io/docs/resource-expander-render-hooks
   */
  resourceIndentClass: refineClassName,

  /**
   * Class names for the toggle that expands or collapses a resource's children or a group. A string,
   * or a function that receives `ResourceExpanderInfo` and returns one.
   * @see https://fullcalendar.io/docs/resource-expander-render-hooks
   */
  resourceExpanderClass: refineClassNameGenerator as Identity<ClassNameGenerator<ResourceExpanderInfo>>,

  /**
   * Custom content for each `resourceExpander` part, injected inside it in place of its default
   * content.
   * @see https://fullcalendar.io/docs/resource-expander-render-hooks
   */
  resourceExpanderContent: identity as Identity<ContentGenerator<ResourceExpanderInfo>>,

  // Timeline
  // --------

  /**
   * Class names for the space above the events in a timeline without resources. A string only;
   * functions are not accepted.
   * @see https://fullcalendar.io/docs/timeline-render-hooks
   */
  timelineTopClass: refineClassName,

  /**
   * Class names for the space below the events in a timeline without resources. A string only;
   * functions are not accepted.
   * @see https://fullcalendar.io/docs/timeline-render-hooks
   */
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

  /**
   * Called after the calendar's resources are first loaded or change in any way, with an array of all
   * resources (the same as `getResources()`).
   * @see https://fullcalendar.io/docs/resourcesSet
   */
  resourcesSet: identity as Identity<(resources: ResourceApi[]) => void>,

  /**
   * Called after a resource is added to the calendar via `addResource`. The info includes the
   * resource and `revert` to undo the addition.
   * @see https://fullcalendar.io/docs/resourceAdd
   */
  resourceAdd: identity as Identity<(info: ResourceAddInfo) => void>,

  /**
   * Called after a resource is modified via its setter methods. The info includes the updated
   * resource, the previous `oldResource`, and `revert` to undo the change.
   * @see https://fullcalendar.io/docs/resourceChange
   */
  resourceChange: identity as Identity<(info: ResourceChangeInfo) => void>,

  /**
   * Called after a resource is removed from the calendar via `remove()`. The info includes the
   * resource and `revert` to undo the removal.
   * @see https://fullcalendar.io/docs/resourceRemove
   */
  resourceRemove: identity as Identity<(info: ResourceRemoveInfo) => void>,

  // internal
  _resourceScrollRequest: identity as Identity<(resourceId: string) => void>,
}

export type PremiumListeners = RawOptionsFromRefiners<typeof LISTENER_REFINERS>
export type PremiumListenersRefined = RefinedOptionsFromRefiners<typeof LISTENER_REFINERS>
