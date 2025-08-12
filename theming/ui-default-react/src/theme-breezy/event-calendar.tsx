import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { defaultUiEventCalendarOptions, optionParams } from '@fullcalendar/theme-breezy-dev/ui-default/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-breezy-dev/slots'
import { eventCalendarAvailableViews, eventCalendarPlugins } from '../lib/event-calendar.js'

const slots = createSlots({
  createElement: React.createElement as any, // HACK
  Fragment: React.Fragment as any, // HACK
}, optionParams)

export interface EventCalendarProps extends CalendarOptions {
  availableViews?: string[]
  addButton?: boolean
  addButtonText?: string
  addButtonHint?: string
  addButtonClick?: (ev: MouseEvent) => void
}

export function EventCalendar({
  availableViews = eventCalendarAvailableViews,
  addButton,
  addButtonText,
  addButtonHint,
  addButtonClick,
  ...calendarOptions
}: EventCalendarProps) {
  return (
    <FullCalendar
      headerToolbar={{
        start: (addButton ? 'add ' : '') + 'today,prev,next',
        center: 'title',
        end: availableViews.join(','),
      }}
      {...defaultUiEventCalendarOptions.optionDefaults}
      {...slots}
      {...calendarOptions}
      plugins={[
        ...eventCalendarPlugins,
        ...(calendarOptions.plugins || []),
      ]}
      buttons={{
        add: {
          isPrimary: true,
          text: addButtonText,
          hint: addButtonHint,
          click: addButtonClick,
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
