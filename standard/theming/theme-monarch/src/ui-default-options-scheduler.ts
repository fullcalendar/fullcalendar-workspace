import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import * as svgIcons from './ui-default-svgs.js'
import { optionParams } from './ui-default-options-event-calendar.js'
import { createSchedulerOnlyOptions } from './options-scheduler.js'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(optionParams)

export const defaultUiSchedulerOnlyOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseSchedulerOnlyOptions.optionDefaults,

    resourceExpanderContent: () => svgIcons.chevronRight('w-[1.25em] h-[1.25em] opacity-65'),
  },
  views: baseSchedulerOnlyOptions.views,
}
