import React from 'react'
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { defaultUiSchedulerOnlyOptions } from '@fullcalendar/theme-monarch-tailwind/ui-default-options-scheduler'
import { EventCalendar } from './event-calendar.js'
import { schedulerAvailableViews, schedulerOnlyPlugins, SchedulerProps } from '@fullcalendar/theme-common/scheduler'

export function Scheduler({
  availableViews = schedulerAvailableViews,
  addButton,
  plugins: userPlugins,
  views: userViews,
  ...restOptions
}: SchedulerProps) {
  return (
    <EventCalendar
      availableViews={availableViews}
      addButton={addButton}
      plugins={[
        ...schedulerOnlyPlugins,
        ...(userPlugins || []),
      ]}

      /* View-Specific
      ------------------------------------------------------------------------------------------- */

      views={mergeViewOptionsMap(
        defaultUiSchedulerOnlyOptions.views || {},
        userViews || {},
      )}

      // spreads
      {...defaultUiSchedulerOnlyOptions.optionDefaults}
      {...restOptions}
    />
  )
}
