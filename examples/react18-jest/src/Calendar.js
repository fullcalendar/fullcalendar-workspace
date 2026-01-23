import React from 'react'
import FullCalendar from '@fullcalendar/react'
import themePlugin from '@fullcalendar/react/themes/classic'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import timelinePlugin from '@fullcalendar/react/timeline'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/classic/theme.css'
import '@fullcalendar/react/themes/classic/palette.css'

const initialDate = '2021-06-10'
const events = [
  {
    title: 'event 1',
    start: '2021-06-10T01:00:00',
    end: '2021-06-10T02:00:00'
  }
]

const Calendar = ({ initialView, eventContent }) => (
  <FullCalendar
    plugins={[
      themePlugin,
      dayGridPlugin,
      timeGridPlugin,
      timelinePlugin
    ]}
    initialView={initialView}
    initialDate={initialDate}
    scrollTime={0}
    events={events}
    eventContent={eventContent}
  />
)

export default Calendar
