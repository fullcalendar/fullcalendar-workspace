import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import { defaultUiSchedulerOnlyOptions } from '@fullcalendar/theme-pulse-dev/ui-default/options-scheduler'
import { EventCalendar } from './event-calendar.js'
import { schedulerAvailableViews, schedulerOnlyPlugins } from '../lib/scheduler-presets.js'

export interface SchedulerProps extends CalendarOptions {
  availableViews?: string[]
  addButton?: boolean
  addButtonText?: string
  addButtonHint?: string
  addButtonClick?: (ev: MouseEvent) => void
}

export function Scheduler({
  availableViews = schedulerAvailableViews,
  addButton,
  addButtonText,
  addButtonHint,
  addButtonClick,
  ...calendarOptions
}: SchedulerProps) {
  return (
    <EventCalendar
      {...defaultUiSchedulerOnlyOptions.optionDefaults}
      {...calendarOptions}
      plugins={[
        ...schedulerOnlyPlugins,
        ...(calendarOptions.plugins || []),
      ]}
      views={mergeViewOptionsMap(
        defaultUiSchedulerOnlyOptions.views || {},
        calendarOptions.views || {},
      )}
      availableViews={availableViews}
      addButton={addButton}
      addButtonText={addButtonText}
      addButtonHint={addButtonHint}
      addButtonClick={addButtonClick}
    />
  )
}
