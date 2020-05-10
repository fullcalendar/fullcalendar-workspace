import { createPlugin } from '@fullcalendar/common'
import './ambient'
import { ResourceDataAdder, ResourceEventConfigAdder, transformIsDraggable } from './View' // TODO: ResourceDataAdder should be own plugin
import { reduceResources } from './reducers/resources'
import { parseEventDef } from './structs/event'
import { massageEventDragMutation, applyEventDefMutation, transformEventDrop } from './EventDragging'
import { transformDateSelectionJoin } from './DateSelecting'
import { transformDatePoint, transformDateSpan } from './api/CalendarApi'
import { isPropsValidWithResources } from './validation'
import { transformExternalDef } from './ExternalElementDragging'
import { transformEventResizeJoin } from './EventResizing'
import './api/EventApi'
import { buildLicenseWarning } from './license'
export { ResourceLaneHookProps, RawResourceLaneHookProps } from './render-hooks'
import { optionChangeHandlers } from './option-change-handlers'
import { OPTION_REFINERS } from './options'
import './options-declare'

// TODO: plugin-ify
import './resource-sources/resource-array'
import './resource-sources/resource-func'
import './resource-sources/resource-json-feed'

export default createPlugin({
  reducers: [ reduceResources ],
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
  viewContainerAppends: [ buildLicenseWarning ],
  eventDropTransformers: [ transformEventDrop ],
  optionChangeHandlers,
  optionRefiners: OPTION_REFINERS
})

export { ResourceDayHeader } from './common/ResourceDayHeader'
export { VResourceJoiner, AbstractResourceDayTableModel, ResourceDayTableModel, DayResourceTableModel, VResourceSplitter } from './common/resource-day-table-model'
export { Resource, ResourceHash, getPublicId } from './structs/resource'
export { ResourceViewProps } from './View'
export { flattenResources, Group, isGroupsEqual, GroupNode, ResourceNode, buildRowNodes, buildResourceFields } from './common/resource-hierarchy'
export { ColSpec, GroupSpec, GroupLaneRenderHooks, ColCellHookProps, ColHeaderHookProps, ColHeaderRenderHooks } from './common/resource-spec'
export { ResourceApi } from './api/ResourceApi'
export { ResourceSplitter } from './common/ResourceSplitter'

export { ResourceLabelRoot, ResourceLabelRootProps } from './common/ResourceLabelRoot'
