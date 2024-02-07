import React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import timelinePlugin from '@fullcalendar/timeline'

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
