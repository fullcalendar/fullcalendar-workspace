import * as exportHooks from 'fullcalendar'
import resourcesReducers from './reducers/resources'

export const ResourcesPlugin = exportHooks.createPlugin({
  reducers: [ resourcesReducers ]
});

(exportHooks as any).ResourcesPlugin = ResourcesPlugin
