import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { defaultUiEventCalendarOptions } from '@fullcalendar/theme-classic-dev/ui-default/options-event-calendar'

export interface EventCalendarProps extends CalendarOptions {
  addButton?: boolean
  addButtonText?: string
  addButtonHint?: string
  addButtonClick?: (ev: MouseEvent) => void
  availableViews?: string[]
}

export function EventCalendar({
  addButton,
  addButtonText,
  addButtonHint,
  addButtonClick,
  availableViews,
  ...calendarOptions
}: EventCalendarProps) {
  return (
    <FullCalendar
      headerToolbar={{
        start: (addButton ? 'add ' : '') + 'today,prev,next',
        center: 'title',
        end: availableViews?.join(','),
      }}
      {...defaultUiEventCalendarOptions.optionDefaults}
      {...calendarOptions}
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
