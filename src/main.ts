import * as exportHooks from 'fullcalendar'
import './Calendar'
import { ResourceDataAdder, ResourceEventConfigAdder } from './View' // TODO: ResourceDataAdder should be own plugin
import resourcesReducers from './reducers/resources'
import { parseEventDef } from './structs/event'
import { massageEventDragMutation, applyEventDefMutation } from './EventDragging'
import { transformDateSelectionJoin } from './DateSelecting'
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
  dateSelectionTransformers: [ transformDateSelectionJoin ],
  dateClickApiTransformers: [ transformDateClickApi ],
  dateSelectionApiTransformers: [ transformDateSelectionApi ],
  viewPropsTransformers: [ ResourceDataAdder, ResourceEventConfigAdder ]
});

exportHooks.Calendar.defaultPlugins.push( // TODO: kill
  GeneralPlugin,
  TimelinePlugin,
  ResourceTimelinePlugin,
  ResourceAgendaPlugin,
  ResourceBasicPlugin
)
