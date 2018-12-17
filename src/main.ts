import * as exportHooks from 'fullcalendar'
import './Calendar'
import { ResourceDataAdder, ResourceEventConfigAdder } from './View' // TODO: ResourceDataAdder should be own plugin
import resourcesReducers from './reducers/resources'
import { parseEventDef } from './structs/event'
import { massageEventDragMutation, applyEventDefMutation } from './EventDragging'
import { transformDateSelectionJoin } from './DateSelecting'
import { transformDatePoint, transformDateSpan } from './Calendar'
import { isPropsValidWithResources } from './validation'
import { transformExternalDef } from './ExternalElementDragging'
import { transformEventResizeJoin } from './EventResizing'
import './api/EventApi'

// TODO: plugin-ify
import './resource-sources/resource-array'
import './resource-sources/resource-func'
import './resource-sources/resource-json-feed'

import TimelinePlugin from './timeline/config'
import ResourceTimelinePlugin from './resource-timeline/config'
import ResourceAgendaPlugin from './resource-agenda/config'
import ResourceBasicPlugin from './resource-basic/config'

export const GeneralPlugin = exportHooks.createPlugin({
  reducers: [ resourcesReducers ],
  eventDefParsers: [ parseEventDef ],
  eventDragMutationMassagers: [ massageEventDragMutation ],
  eventDefMutationAppliers: [ applyEventDefMutation ],
  dateSelectionTransformers: [ transformDateSelectionJoin ],
  datePointTransforms: [ transformDatePoint ],
  dateSpanTransforms: [ transformDateSpan ],
  viewPropsTransformers: [ ResourceDataAdder, ResourceEventConfigAdder ],
  isPropsValid: isPropsValidWithResources,
  externalDefTransforms: [ transformExternalDef ],
  eventResizeJoinTransforms: [ transformEventResizeJoin ]
})

exportHooks.Calendar.defaultPlugins.push( // TODO: kill
  GeneralPlugin,
  TimelinePlugin,
  ResourceTimelinePlugin,
  ResourceAgendaPlugin,
  ResourceBasicPlugin
)
