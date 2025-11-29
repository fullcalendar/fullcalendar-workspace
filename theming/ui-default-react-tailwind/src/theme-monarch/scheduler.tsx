import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { defaultUiSchedulerOnlyOptions } from '@fullcalendar/theme-monarch-dev/ui-default-options-scheduler'
import { EventCalendar } from './event-calendar.js'
import { schedulerAvailableViews, schedulerOnlyPlugins } from '@fullcalendar/theme-common/scheduler'

export interface SchedulerProps extends CalendarOptions {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

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
