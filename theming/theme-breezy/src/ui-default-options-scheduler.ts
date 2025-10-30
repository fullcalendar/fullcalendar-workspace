import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import * as svgs from './ui-default-svgs.js'
import { params, mutedFgPressableGroupClass } from './ui-default-options-event-calendar.js'
import { createSchedulerOnlyOptions } from './options-scheduler.js'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(params)

export const defaultUiSchedulerOnlyOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseSchedulerOnlyOptions.optionDefaults,

    resourceExpanderContent: (data) => svgs.chevronDown(
      joinClassNames(
        `size-5 ${mutedFgPressableGroupClass}`,
        !data.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90',
      )
    )
  },
  views: baseSchedulerOnlyOptions.views,
}
