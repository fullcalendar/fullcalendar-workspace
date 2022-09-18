import { createPlugin } from '@fullcalendar/core'

import { default as premiumCommonPlugin } from '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates
// ensure ambient declarations
import '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates

import './ambient'
import { ResourceDataAdder, transformIsDraggable } from './View.js' // TODO: ResourceDataAdder should be own plugin
import { ResourceEventConfigAdder } from './ResourceEventConfigAdder.js'
import { reduceResources, ResourceState } from './reducers/resources.js'
import { generateEventDefResourceMembers, EVENT_REFINERS } from './structs/event-parse.js'
import './structs/event-declare'
import { massageEventDragMutation, applyEventDefMutation, transformEventDrop } from './EventDragging.js'
import { transformDateSelectionJoin } from './DateSelecting.js'
import { transformDatePoint, transformDateSpan } from './api/CalendarApi-extend.js'
import './api/CalendarApi-declare'
import { isPropsValidWithResources } from './validation.js'
import { transformExternalDef } from './ExternalElementDragging.js'
import './api/EventApi-extend'
import './api/EventApi-declare'
import { optionChangeHandlers } from './option-change-handlers.js'
import { handleResourceStore } from './resources-crud.js'
import { OPTION_REFINERS, LISTENER_REFINERS } from './options.js'
import './options-declare'

// TODO: plugin-ify
import './resource-sources/resource-array'
import './resource-sources/resource-func'
import './resource-sources/resource-json-feed'

export { ResourceLaneContentArg, ResourceLaneHookPropsInput } from './render-hooks.js'

export * from './api-type-deps.js'
export { DEFAULT_RESOURCE_ORDER } from './resources-crud.js'

export default createPlugin({
  deps: [
    premiumCommonPlugin,
  ],
  reducers: [
    reduceResources,
  ],
  isLoadingFuncs: [
    (state: ResourceState) => state.resourceSource && state.resourceSource.isFetching,
  ],
  eventRefiners: EVENT_REFINERS,
  eventDefMemberAdders: [generateEventDefResourceMembers],
  isDraggableTransformers: [transformIsDraggable],
  eventDragMutationMassagers: [massageEventDragMutation],
  eventDefMutationAppliers: [applyEventDefMutation],
  dateSelectionTransformers: [transformDateSelectionJoin],
  datePointTransforms: [transformDatePoint],
  dateSpanTransforms: [transformDateSpan],
  viewPropsTransformers: [ResourceDataAdder, ResourceEventConfigAdder],
  isPropsValid: isPropsValidWithResources,
  externalDefTransforms: [transformExternalDef],
  eventDropTransformers: [transformEventDrop],
  optionChangeHandlers,
  optionRefiners: OPTION_REFINERS,
  listenerRefiners: LISTENER_REFINERS,
  propSetHandlers: { resourceStore: handleResourceStore },
})

export { ResourceDayHeader } from './common/ResourceDayHeader.js'
export { AbstractResourceDayTableModel } from './common/AbstractResourceDayTableModel.js'
export { ResourceDayTableModel } from './common/ResourceDayTableModel.js'
export { DayResourceTableModel } from './common/DayResourceTableModel.js'
export { VResourceJoiner } from './common/VResourceJoiner.js'
export { VResourceSplitter } from './common/VResourceSplitter.js'
export { Resource, ResourceHash, getPublicId } from './structs/resource.js'
export { ResourceViewProps } from './View.js'
export {
  flattenResources,
  Group,
  isGroupsEqual,
  GroupNode,
  ResourceNode,
  buildRowNodes,
  buildResourceFields,
} from './common/resource-hierarchy.js'
export {
  ColSpec,
  GroupSpec,
  GroupLaneRenderHooks,
  ColCellContentArg,
  ColCellMountArg,
  ColHeaderContentArg,
  ColHeaderMountArg,
  ColHeaderRenderHooks,
} from './common/resource-spec.js'
export { ResourceApi } from './api/ResourceApi.js'
export { ResourceSplitter } from './common/ResourceSplitter.js'
export { ResourceLabelRoot, ResourceLabelRootProps } from './common/ResourceLabelRoot.js'
