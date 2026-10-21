import { PluginInput } from '@fullcalendar/preact/public-api'
import premiumCommonPlugin from '../premium-common/plugin'
import { ResourceDataAdder, ResourceEventConfigAdder } from './view-props'
import { reduceResources, ResourceState } from './store/resource-state'
import { runResourceSourceFetch } from './store/run-fetch-resource-source'
import { createResourceActions } from './api/resource-actions'
import { generateEventDefResourceMembers, EVENT_REFINERS } from './event-resource-parse'
import { massageEventDragMutation, applyEventDefMutation, transformEventDrop, transformIsDraggable } from './interactions/event-dragging'
import { transformDateSelectionJoin } from './interactions/date-selecting'
import { transformDateSpan } from './date-span'
import { isPropsValidWithResources } from './validation'
import { transformExternalDef } from './interactions/external-element-dragging'
import { optionChangeHandlers } from './option-change-handlers'
import { handleResourceStore } from './resource-crud'

export default {
  name: 'resource',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [premiumCommonPlugin],
  reducers: [reduceResources],
  calendarActions: createResourceActions,
  effectRunners: {
    fetchResourceSource: runResourceSourceFetch,
  },
  isLoadingFuncs: [
    (state: ResourceState) => state.resourceSource && state.resourceSource.isFetching,
  ],
  eventRefiners: EVENT_REFINERS,
  eventDefMemberAdders: [generateEventDefResourceMembers],
  isDraggableTransformers: [transformIsDraggable],
  eventDragMutationMassagers: [massageEventDragMutation],
  eventDefMutationAppliers: [applyEventDefMutation],
  dateSelectionTransformers: [transformDateSelectionJoin],
  datePointTransforms: [transformDateSpan],
  dateSpanTransforms: [transformDateSpan],
  viewPropsTransformers: [ResourceDataAdder, ResourceEventConfigAdder],
  isPropsValid: isPropsValidWithResources,
  externalDefTransforms: [transformExternalDef],
  eventDropTransformers: [transformEventDrop],
  optionChangeHandlers,
  propSetHandlers: { resourceStore: handleResourceStore },
} as PluginInput
