import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import * as svgs from './ui-default-svgs.js'
import { optionParams } from './ui-default-options-event-calendar.js'
import { createSchedulerOnlyOptions } from './options-scheduler.js'

const expanderIconClass = 'size-4'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(optionParams)

export const defaultUiSchedulerOnlyOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseSchedulerOnlyOptions.optionDefaults,

    resourceExpanderContent: (data) => data.isExpanded
      ? svgs.minusSquare(expanderIconClass)
      : svgs.plusSquare(expanderIconClass),
  },
  views: baseSchedulerOnlyOptions.views,
}
