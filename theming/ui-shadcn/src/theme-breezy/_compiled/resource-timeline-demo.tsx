import React from 'react'
import { ResourceTimeline } from './resource-timeline.js'

export function ResourceTimelineDemo() {
  return (
    <ResourceTimeline
      className='max-w-300 my-10 mx-auto'
      editable
      selectable
      nowIndicator
      navLinks
      aspectRatio={1.5}
      timeZone='UTC'
      resourceColumnHeaderContent='Rooms'
      resources='https://fullcalendar.io/api/demo-feeds/resources.json?with-nesting&with-colors'
      events='https://fullcalendar.io/api/demo-feeds/events.json?single-day&for-resource-timeline'
      addButton={{
        text: 'Add Room',
        click() {
          alert('add room...')
        }
      }}
    />
  )
}
