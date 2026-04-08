import { PluginInput } from '@fullcalendar/react'
import { mergeCalendarOptions, mergeViewOptionsMap } from '@fullcalendar/react/protected-api'
import { defaultUiEventCalendarOptions, params } from './ui-default-options-event-calendar'
import { defaultUiSchedulerOnlyOptions } from './ui-default-options-scheduler'
import { createSlots } from './slots'

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
} as PluginInput
