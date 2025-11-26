import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { defaultUiEventCalendarOptions, params } from '@fullcalendar/theme-monarch-dev/ui-default/options-event-calendar'
import { createSlots } from '@fullcalendar/theme-monarch-dev/slots'
import { eventCalendarAvailableViews, eventCalendarPlugins } from '../lib/event-calendar-presets.js'

const slots = createSlots({
  createElement: React.createElement as any, // HACK
  Fragment: React.Fragment as any, // HACK
}, params)

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
  plugins: userPlugins,
  buttons: userButtons,
  views: userViews,
  ...restOptions
}: EventCalendarProps) {
  return (
    <FullCalendar
      initialView={availableViews[0]}
      plugins={[
        ...eventCalendarPlugins,
        ...(userPlugins || []),
      ]}

      /* Toolbar
      ------------------------------------------------------------------------------------------- */

      headerToolbar={{
        start: (addButton ? 'add ' : '') + 'today prev,next title',
        end: availableViews.join(','),
      }}
      buttons={{
        add: {
          isPrimary: true,
          ...addButton,
        },
        ...defaultUiEventCalendarOptions.optionDefaults.buttons,
        ...userButtons,
      }}

      /* View-Specific
      ------------------------------------------------------------------------------------------- */

      views={mergeViewOptionsMap(
        defaultUiEventCalendarOptions.views || {},
        userViews || {},
      )}

      // spreads
      {...defaultUiEventCalendarOptions.optionDefaults}
      {...slots}
      {...restOptions}
    />
  )
}
