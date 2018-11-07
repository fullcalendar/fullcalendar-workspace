import * as exportHooks from 'fullcalendar'
import resourcesReducers from './reducers/resources'

// "plugins"
import './resource-sources/resource-array'
import './resource-sources/resource-func'
import './resource-sources/resource-json-feed'
import './timeline/config'
import './resource-agenda/config'

export const ResourcesPlugin = exportHooks.createPlugin({
  reducers: [ resourcesReducers ]
});

(exportHooks as any).ResourcesPlugin = ResourcesPlugin
