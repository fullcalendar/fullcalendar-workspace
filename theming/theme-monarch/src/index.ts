import { createElement, Fragment } from '@fullcalendar/core/preact'
import { createPlugin, PluginDef } from '@fullcalendar/core'
import { defaultUiEventCalendarOptions, optionParams } from './ui-default-options-event-calendar.js'
import { defaultUiSchedulerOnlyOptions } from './ui-default-options-scheduler.js'
import { createSlots } from './slots.js'

export default createPlugin({
  name: '@fullcalendar/theme-monarch',
  optionDefaults: {
    ...defaultUiEventCalendarOptions.optionDefaults,
    ...defaultUiSchedulerOnlyOptions.optionDefaults,
    ...createSlots({ createElement, Fragment }, optionParams),
  },
  views: {
    ...defaultUiEventCalendarOptions.views,
    ...defaultUiSchedulerOnlyOptions.views,
  },
}) as PluginDef
