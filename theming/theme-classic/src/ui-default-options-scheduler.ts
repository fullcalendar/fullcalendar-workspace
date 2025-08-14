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

    resourceExpanderContent: (data) => data.isExpanded
      ? svgIcons.minusSquare('w-[1em] h-[1em]')
      : svgIcons.plusSquare('w-[1em] h-[1em]'), // TODO: fix sizing!
  },
  views: baseSchedulerOnlyOptions.views,
}
