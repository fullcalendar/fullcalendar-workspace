import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/react'
import * as svgs from './ui-default-svgs'
import { params, mutedFgPressableGroupClass } from './ui-default-options-event-calendar'
import { createSchedulerOnlyOptions } from './options-scheduler'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(params)

export const defaultUiSchedulerOnlyOptions: {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} = {
  optionDefaults: {
    ...baseSchedulerOnlyOptions.optionDefaults,

    /* Resource Data Grid
    --------------------------------------------------------------------------------------------- */

    resourceExpanderContent: (data) => svgs.chevronDown(
      joinClassNames(
        `size-4 ${mutedFgPressableGroupClass}`,
        !data.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90'
      ),
    ),
  },
  views: baseSchedulerOnlyOptions.views,
}
