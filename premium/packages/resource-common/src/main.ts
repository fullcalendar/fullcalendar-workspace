import { createPlugin } from '@fullcalendar/common'

import premiumCommonPlugin from '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates
// ensure ambient declarations
import '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates

import './ambient'
import { ResourceDataAdder, transformIsDraggable } from './View' // TODO: ResourceDataAdder should be own plugin
import { ResourceEventConfigAdder } from './ResourceEventConfigAdder'
import { reduceResources, ResourceState } from './reducers/resources'
import { generateEventDefResourceMembers, EVENT_REFINERS } from './structs/event-parse'
import './structs/event-declare'
import { massageEventDragMutation, applyEventDefMutation, transformEventDrop } from './EventDragging'
import { transformDateSelectionJoin } from './DateSelecting'
import { transformDatePoint, transformDateSpan } from './api/CalendarApi-extend'
import './api/CalendarApi-declare'
import { isPropsValidWithResources } from './validation'
import { transformExternalDef } from './ExternalElementDragging'
import './api/EventApi-extend'
import './api/EventApi-declare'
import { optionChangeHandlers } from './option-change-handlers'
import { handleResourceStore } from './resources-crud'
import { OPTION_REFINERS, LISTENER_REFINERS } from './options'
import './options-declare'

// TODO: plugin-ify
import './resource-sources/resource-array'
import './resource-sources/resource-func'
import './resource-sources/resource-json-feed'

export { ResourceLaneContentArg, ResourceLaneHookPropsInput } from './render-hooks'

export * from './api-type-deps'
export { DEFAULT_RESOURCE_ORDER } from './resources-crud'

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

export { ResourceDayHeader } from './common/ResourceDayHeader'
export { AbstractResourceDayTableModel } from './common/AbstractResourceDayTableModel'
export { ResourceDayTableModel } from './common/ResourceDayTableModel'
export { DayResourceTableModel } from './common/DayResourceTableModel'
export { VResourceJoiner } from './common/VResourceJoiner'
export { VResourceSplitter } from './common/VResourceSplitter'
export { Resource, ResourceHash, getPublicId } from './structs/resource'
export { ResourceViewProps } from './View'
export {
  flattenResources,
  Group,
  isGroupsEqual,
  GroupNode,
  ResourceNode,
  buildRowNodes,
  buildResourceFields,
} from './common/resource-hierarchy'
export {
  ColSpec,
  GroupSpec,
  GroupLaneRenderHooks,
  ColCellContentArg,
  ColCellMountArg,
  ColHeaderContentArg,
  ColHeaderMountArg,
  ColHeaderRenderHooks,
} from './common/resource-spec'
export { ResourceApi } from './api/ResourceApi'
export { ResourceSplitter } from './common/ResourceSplitter'
export { ResourceLabelRoot, ResourceLabelRootProps } from './common/ResourceLabelRoot'
