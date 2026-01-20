import { createPlugin, PluginDef } from '@fullcalendar/preact/public-api'
import premiumCommonPlugin from '../common/plugin'
import { ResourceDataAdder, transformIsDraggable } from './View'
import { ResourceEventConfigAdder } from './ResourceEventConfigAdder'
import { reduceResources, ResourceState } from './reducers/resources'
import { generateEventDefResourceMembers, EVENT_REFINERS } from './structs/event-parse'
import { massageEventDragMutation, applyEventDefMutation, transformEventDrop } from './EventDragging'
import { transformDateSelectionJoin } from './DateSelecting'
import { transformDatePoint, transformDateSpan } from './api/CalendarApi'
import { isPropsValidWithResources } from './validation'
import { transformExternalDef } from './ExternalElementDragging'
import { optionChangeHandlers } from './option-change-handlers'
import { handleResourceStore } from './resources-crud'
import { OPTION_REFINERS, LISTENER_REFINERS } from './options'

// SIDE EFFECTS
import '../ambient'
import './api/EventApi'
import './api/CalendarApi'
// TODO: plugin-ify
import './resource-sources/resource-array'
import './resource-sources/resource-func'
import './resource-sources/resource-json-feed'

export default createPlugin({
  name: 'resource',
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
}) as PluginDef
