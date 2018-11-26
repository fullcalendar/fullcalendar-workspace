import * as exportHooks from 'fullcalendar'
import './Calendar'
import './View'
import resourcesReducers from './reducers/resources'
import { parseEventDef } from './structs/event'
import { massageEventDragMutation, applyEventDefMutation } from './EventDragging'
import { transformDateSelection } from './DateSelecting'
import { transformDateClickApi, transformDateSelectionApi } from './Calendar'

// "plugins"
import './resource-sources/resource-array'
import './resource-sources/resource-func'
import './resource-sources/resource-json-feed'
import './timeline/config'
import './resource-timeline/config'
import './resource-agenda/config'
import './resource-basic/config'

export const ResourcesPlugin = exportHooks.createPlugin({
  reducers: [ resourcesReducers ],
  eventDefParsers: [ parseEventDef ],
  eventDragMutationMassagers: [ massageEventDragMutation ],
  eventDefMutationAppliers: [ applyEventDefMutation ],
  dateSelectionTransformers: [ transformDateSelection ],
  dateClickApiTransformers: [ transformDateClickApi ],
  dateSelectionApiTransformers: [ transformDateSelectionApi ]
});

exportHooks.Calendar.defaultPlugins.push(ResourcesPlugin); // TODO: kill

(exportHooks as any).ResourcesPlugin = ResourcesPlugin
