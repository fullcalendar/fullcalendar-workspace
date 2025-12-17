import React from 'react'
import { EventCalendar } from './event-calendar.js'

export function EventCalendarDemo() {
  return (
    <EventCalendar
      className='max-w-300 my-10 mx-auto'
      editable
      selectable
      nowIndicator
      navLinks
      timeZone='UTC'
      events='https://fullcalendar.io/api/demo-feeds/events.json'
      addButton={{
        text: 'Add Event',
        click() {
          alert('add event...')
        }
      }}
    />
  )
}
