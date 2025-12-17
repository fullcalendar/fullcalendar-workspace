import React from 'react'
import { ResourceTimeGrid } from './resource-timegrid.js'

const msInHour = 1000 * 60 * 60
const nowDate = new Date()

const events = [
  {
    title: 'Event 1',
    resourceId: 'a',
    start: new Date(nowDate.getTime() - msInHour * 4),
    end: new Date(nowDate.getTime() - msInHour)
  },
  {
    title: 'Event 2',
    resourceId: 'b',
    start: new Date(nowDate.getTime() - msInHour * 2),
    end: new Date(nowDate.getTime() + msInHour * 2)
  },
  {
    title: 'Event 3',
    resourceId: 'c',
    start: new Date(nowDate.getTime() + msInHour * 1),
    end: new Date(nowDate.getTime() + msInHour * 6)
  },
]

const resources = [
  {
    id: 'a',
    title: 'Resource A',
  },
  {
    id: 'b',
    title: 'Resource B',
  },
  {
    id: 'c',
    title: 'Resource C'
  },
]

export function ResourceTimeGridDemo() {
  return (
    <ResourceTimeGrid
      className='max-w-300 my-10 mx-auto'
      editable
      nowIndicator
      navLinks
      dayMinWidth={200}
      events={events}
      resources={resources}
      addButton={{
        text: 'Add Resource',
        click() {
          alert('add resource...')
        }
      }}
    />
  )
}
