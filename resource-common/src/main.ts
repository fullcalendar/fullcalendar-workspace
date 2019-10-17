import { createPlugin } from '@fullcalendar/core'
import './ambient'
import { ResourceDataAdder, ResourceEventConfigAdder, transformIsDraggable } from './View' // TODO: ResourceDataAdder should be own plugin
import resourcesReducers from './reducers/resources'
import { parseEventDef } from './structs/event'
import { massageEventDragMutation, applyEventDefMutation, transformEventDrop } from './EventDragging'
import { transformDateSelectionJoin } from './DateSelecting'
import { transformDatePoint, transformDateSpan } from './Calendar'
import { isPropsValidWithResources } from './validation'
import { transformExternalDef } from './ExternalElementDragging'
import { transformEventResizeJoin } from './EventResizing'
import './api/EventApi'
import { injectLicenseWarning } from './license'
import optionChangeHandlers from './option-change-handlers'

// TODO: plugin-ify
import './resource-sources/resource-array'
import './resource-sources/resource-func'
import './resource-sources/resource-json-feed'

export default createPlugin({
  reducers: [ resourcesReducers ],
  eventDefParsers: [ parseEventDef ],
  isDraggableTransformers: [ transformIsDraggable ],
  eventDragMutationMassagers: [ massageEventDragMutation ],
  eventDefMutationAppliers: [ applyEventDefMutation ],
  dateSelectionTransformers: [ transformDateSelectionJoin ],
  datePointTransforms: [ transformDatePoint ],
  dateSpanTransforms: [ transformDateSpan ],
  viewPropsTransformers: [ ResourceDataAdder, ResourceEventConfigAdder ],
  isPropsValid: isPropsValidWithResources,
  externalDefTransforms: [ transformExternalDef ],
  eventResizeJoinTransforms: [ transformEventResizeJoin ],
  viewContainerModifiers: [ injectLicenseWarning ],
  eventDropTransformers: [ transformEventDrop ],
  optionChangeHandlers
})

export { default as ResourceDayHeader } from './common/ResourceDayHeader'
export { VResourceJoiner, AbstractResourceDayTable, ResourceDayTable, DayResourceTable, VResourceSplitter } from './common/resource-day-table'
export { Resource, ResourceHash } from './structs/resource'
export { ResourceViewProps } from './View'
export { flattenResources, Group, isGroupsEqual, GroupNode, ResourceNode, buildRowNodes, buildResourceFields } from './common/resource-hierarchy'
export { buildResourceTextFunc } from './common/resource-rendering'
export { default as ResourceApi } from './api/ResourceApi'
export { default as ResourceSplitter } from './common/ResourceSplitter'
