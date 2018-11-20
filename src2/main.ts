import * as exportHooks from 'fullcalendar'
import './View'
import resourcesReducers from './reducers/resources'
import { parseEventDef } from './structs/event'
import { massageEventDragMutation, applyEventDefMutation } from './EventDragging'

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
  eventDefMutationAppliers: [ applyEventDefMutation ]
});

(exportHooks as any).ResourcesPlugin = ResourcesPlugin
