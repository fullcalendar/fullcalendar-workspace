import { createPlugin } from '@fullcalendar/core'
import premiumCommonPlugin from '@fullcalendar/premium-common'
import { ResourceDataAdder, transformIsDraggable } from './View.js'
import { ResourceEventConfigAdder } from './ResourceEventConfigAdder.js'
import { reduceResources, ResourceState } from './reducers/resources.js'
import { generateEventDefResourceMembers, EVENT_REFINERS } from './structs/event-parse.js'
import { massageEventDragMutation, applyEventDefMutation, transformEventDrop } from './EventDragging.js'
import { transformDateSelectionJoin } from './DateSelecting.js'
import { transformDatePoint, transformDateSpan } from './api/CalendarApi.js'
import { isPropsValidWithResources } from './validation.js'
import { transformExternalDef } from './ExternalElementDragging.js'
import { optionChangeHandlers } from './option-change-handlers.js'
import { handleResourceStore } from './resources-crud.js'
import { OPTION_REFINERS, LISTENER_REFINERS } from './options-refiners.js'
import './ambient.js'
import './api/EventApi.js'
import './api/CalendarApi.js'

// TODO: plugin-ify
import './resource-sources/resource-array.js'
import './resource-sources/resource-func.js'
import './resource-sources/resource-json-feed.js'

export default createPlugin({
  name: '<%= pkgName %>',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [premiumCommonPlugin],
  reducers: [reduceResources],
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

export * from './public-types.js'
export { ResourceApi } from './api/ResourceApi.js'
export { ResourceLaneContentArg, ResourceLaneContentArgInput } from './render-hooks.js'
export {
  ColCellContentArg,
  ColCellMountArg,
  ColHeaderContentArg,
  ColHeaderMountArg,
  ColHeaderRenderHooks,
  GroupLaneRenderHooks,
} from './common/resource-spec.js'
