import React from 'react'
import { ResourceTimeGrid } from './resource-timegrid.js'

export function ResourceTimeGridDemo() {
  return (
    <ResourceTimeGrid
      className='max-w-300 my-10 mx-auto'
      editable
      selectable
      nowIndicator
      navLinks
      dayMinWidth={200}
      timeZone='UTC'
      resources={[
        { id: 'a', title: 'Room A' },
        { id: 'b', title: 'Room B' },
        { id: 'c', title: 'Room C' },
      ]}
      events='https://fullcalendar.io/api/demo-feeds/events.json?with-resources=3&single-day'
      addButton={{
        text: 'Add Room',
        click() {
          alert('add room...')
        }
      }}
    />
  )
}
