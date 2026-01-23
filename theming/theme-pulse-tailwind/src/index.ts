import { PluginDefInput } from '@fullcalendar/react'
import { mergeCalendarOptions, mergeViewOptionsMap } from '@fullcalendar/react/protected-api'
import { defaultUiEventCalendarOptions, params } from './ui-default-options-event-calendar.js'
import { defaultUiSchedulerOnlyOptions } from './ui-default-options-scheduler.js'
import { createSlots } from './slots.js'

export default {
  name: '@fullcalendar/theme-pulse',
  optionDefaults: mergeCalendarOptions(
    defaultUiEventCalendarOptions.optionDefaults,
    defaultUiSchedulerOnlyOptions.optionDefaults,
    createSlots(params),
  ),
  views: mergeViewOptionsMap(
    defaultUiEventCalendarOptions.views || {},
    defaultUiSchedulerOnlyOptions.views || {},
  ),
} as PluginDefInput
