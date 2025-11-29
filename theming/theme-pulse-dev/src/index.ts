import { createElement, Fragment } from '@fullcalendar/core/preact'
import { createPlugin, PluginDef } from '@fullcalendar/core'
import { mergeCalendarOptions, mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { defaultUiEventCalendarOptions, params } from './ui-default-options-event-calendar.js'
import { defaultUiSchedulerOnlyOptions } from './ui-default-options-scheduler.js'
import { createSlots } from './slots.js'

export default createPlugin({
  name: '@fullcalendar/theme-pulse',
  optionDefaults: mergeCalendarOptions(
    defaultUiEventCalendarOptions.optionDefaults,
    defaultUiSchedulerOnlyOptions.optionDefaults,
    createSlots({ createElement, Fragment }, params),
  ),
  views: mergeViewOptionsMap(
    defaultUiEventCalendarOptions.views || {},
    defaultUiSchedulerOnlyOptions.views || {},
  ),
}) as PluginDef
