import React from 'react'
import { mergeViewOptionsMap } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import { defaultUiEventCalendarOptions } from '@fullcalendar/theme-classic-dev/ui-default-options-event-calendar'
import { eventCalendarAvailableViews, eventCalendarPlugins, EventCalendarProps } from '@fullcalendar/theme-common/event-calendar'

const { buttons: defaultButtons, ...restOptionDefaults } = defaultUiEventCalendarOptions.optionDefaults

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
        start: (addButton ? 'add ' : '') + 'today prev,next',
        center: 'title',
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
      {...restOptions}
    />
  )
}
