import { createPlugin, PluginDef } from '@fullcalendar/core'
import { mergeCalendarOptions, mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { defaultUiEventCalendarOptions } from './ui-default-options-event-calendar.js'
import { defaultUiSchedulerOnlyOptions } from './ui-default-options-scheduler.js'

export default createPlugin({
  name: '@fullcalendar/theme-classic',
  optionDefaults: mergeCalendarOptions(
    defaultUiEventCalendarOptions.optionDefaults,
    defaultUiSchedulerOnlyOptions.optionDefaults,
  ),
  views: mergeViewOptionsMap(
    defaultUiEventCalendarOptions.views || {},
    defaultUiSchedulerOnlyOptions.views || {},
  ),
}) as PluginDef
