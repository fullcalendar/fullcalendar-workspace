import { CalendarOptions, ViewOptions } from '@fullcalendar/core'
import * as svgIcons from './ui-default-svgs.js'
import { optionParams } from './ui-default-options-event-calendar.js'
import { createSchedulerOnlyOptions } from './options-scheduler.js'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(optionParams)

const expanderIconClass = 'size-[1em] opacity-65'

export const defaultUiSchedulerOnlyOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseSchedulerOnlyOptions.optionDefaults,

    resourceExpanderContent: (data) => data.isExpanded
      ? svgIcons.minusSquare(expanderIconClass)
      : svgIcons.plusSquare(expanderIconClass),
  },
  views: baseSchedulerOnlyOptions.views,
}
