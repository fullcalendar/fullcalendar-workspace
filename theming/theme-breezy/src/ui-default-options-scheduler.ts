import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import * as svgs from './ui-default-svgs.js'
import { optionParams, pressableIconClass } from './ui-default-options-event-calendar.js'
import { createSchedulerOnlyOptions } from './options-scheduler.js'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(optionParams)

export const defaultUiSchedulerOnlyOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseSchedulerOnlyOptions.optionDefaults,

    resourceExpanderContent: (data) => svgs.chevronDown(
      joinClassNames(
        `size-5 ${pressableIconClass}`,
        !data.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90',
      )
    )
  },
  views: baseSchedulerOnlyOptions.views,
}
