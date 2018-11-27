import * as exportHooks from 'fullcalendar'
import './Calendar'
import './View'
import resourcesReducers from './reducers/resources'
import { parseEventDef } from './structs/event'
import { massageEventDragMutation, applyEventDefMutation } from './EventDragging'
import { transformDateSelection } from './DateSelecting'
import { transformDateClickApi, transformDateSelectionApi } from './Calendar'

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
  dateSelectionTransformers: [ transformDateSelection ],
  dateClickApiTransformers: [ transformDateClickApi ],
  dateSelectionApiTransformers: [ transformDateSelectionApi ]
});

exportHooks.Calendar.defaultPlugins.push( // TODO: kill
  GeneralPlugin,
  TimelinePlugin,
  ResourceTimelinePlugin,
  ResourceAgendaPlugin,
  ResourceBasicPlugin
)
