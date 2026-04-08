import { PluginInput } from '@fullcalendar/react'
import { mergeCalendarOptions, mergeViewOptionsMap } from '@fullcalendar/react/protected-api'
import { defaultUiEventCalendarOptions } from './ui-default-options-event-calendar'
import { defaultUiSchedulerOnlyOptions } from './ui-default-options-scheduler'

export default {
  name: 'theme-classic',
  optionDefaults: mergeCalendarOptions(
    defaultUiEventCalendarOptions.optionDefaults,
    defaultUiSchedulerOnlyOptions.optionDefaults,
  ),
  views: mergeViewOptionsMap(
    defaultUiEventCalendarOptions.views || {},
    defaultUiSchedulerOnlyOptions.views || {},
  ),
} as PluginInput
