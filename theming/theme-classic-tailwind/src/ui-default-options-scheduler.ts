import { CalendarOptions, ViewOptions } from '@fullcalendar/react'
import * as svgs from './ui-default-svgs'
import { params } from './ui-default-options-event-calendar'
import { createSchedulerOnlyOptions } from './options-scheduler'

const expanderIconClass = 'size-4 not-group-hover:opacity-65'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(params)

export const defaultUiSchedulerOnlyOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseSchedulerOnlyOptions.optionDefaults,

    /* Resource Data Grid
    --------------------------------------------------------------------------------------------- */

    resourceExpanderContent: (info) => info.isExpanded
      ? svgs.minusSquare(expanderIconClass)
      : svgs.plusSquare(expanderIconClass),
  },
  views: baseSchedulerOnlyOptions.views,
}
