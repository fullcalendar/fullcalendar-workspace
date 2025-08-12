import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { defaultUiEventCalendarOptions } from '@fullcalendar/theme-classic-dev/ui-default/options-event-calendar'
import { eventCalendarAvailableViews, eventCalendarPlugins } from '../lib/event-calendar-presets.js'

export interface EventCalendarProps extends CalendarOptions {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export function EventCalendar({
  availableViews = eventCalendarAvailableViews,
  addButton,
  ...calendarOptions
}: EventCalendarProps) {
  return (
    <FullCalendar
      headerToolbar={{
        start: (addButton ? 'add ' : '') + 'today prev,next',
        center: 'title',
        end: availableViews.join(','),
      }}
      initialView={availableViews[0]}
      {...defaultUiEventCalendarOptions.optionDefaults}
      {...calendarOptions}
      plugins={[
        ...eventCalendarPlugins,
        ...(calendarOptions.plugins || []),
      ]}
      buttons={{
        add: {
          isPrimary: true,
          ...addButton,
        },
        ...defaultUiEventCalendarOptions.optionDefaults.buttons,
        ...calendarOptions.buttons,
      }}
      views={mergeViewOptionsMap(
        defaultUiEventCalendarOptions.views || {},
        calendarOptions.views || {},
      )}
    />
  )
}
