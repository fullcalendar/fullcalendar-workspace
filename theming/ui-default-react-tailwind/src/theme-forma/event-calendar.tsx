import React from 'react'
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { defaultUiEventCalendarOptions, params } from '@fullcalendar/theme-forma-dev/ui-default-options-event-calendar'
import { createSlots } from '@fullcalendar/theme-forma-dev/slots'
import { eventCalendarAvailableViews, eventCalendarPlugins, EventCalendarProps } from '@fullcalendar/theme-common/event-calendar'

const { buttons: defaultButtons, ...restOptionDefaults } = defaultUiEventCalendarOptions.optionDefaults

const slots = createSlots({
  createElement: React.createElement as any, // HACK
  Fragment: React.Fragment as any, // HACK
}, params)

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
        ...defaultButtons,
        ...userButtons,
        add: {
          isPrimary: true,
          ...addButton,
        },
      }}

      /* View-Specific
      ------------------------------------------------------------------------------------------- */

      views={mergeViewOptionsMap(
        defaultUiEventCalendarOptions.views || {},
        userViews || {},
      )}

      // spreads
      {...restOptionDefaults}
      {...slots}
      {...restOptions}
    />
  )
}
