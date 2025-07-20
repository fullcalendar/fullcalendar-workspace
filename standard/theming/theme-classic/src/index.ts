import { createPlugin, PluginDef } from '@fullcalendar/core'
import { defaultUiEventCalendarOptions } from './ui-default-options-event-calendar.js'
import { defaultUiSchedulerOnlyOptions } from './ui-default-options-scheduler.js'

export default createPlugin({
  name: '@fullcalendar/theme-classic',
  optionDefaults: {
    ...defaultUiEventCalendarOptions.optionDefaults,
    ...defaultUiSchedulerOnlyOptions.optionDefaults,
  },
  views: {
    ...defaultUiEventCalendarOptions.views,
    ...defaultUiSchedulerOnlyOptions.views,
  },
}) as PluginDef
