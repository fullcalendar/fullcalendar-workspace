import React from 'react'
import { EventCalendar } from '../theme-breezy/_gen/event-calendar.js'
import { Scheduler } from '../theme-breezy/_gen/scheduler.js'

/*
There's currently a bug with Breezy where mutedBorderColorClass was injected with var(--muted-foreground)
*/

const sampleEvents = [
  {
    id: '1',
    title: 'Team Meeting',
    start: '2024-01-15T10:00:00',
    end: '2024-01-15T11:00:00',
  },
  {
    id: '2',
    title: 'Project Review',
    start: '2024-01-16T14:00:00',
    end: '2024-01-16T15:30:00',
  },
  {
    id: '3',
    title: 'Client Presentation',
    start: '2024-01-17T09:00:00',
    end: '2024-01-17T10:30:00',
  },
  {
    id: '4',
    title: 'Design Workshop',
    start: '2024-01-18T13:00:00',
    end: '2024-01-18T16:00:00',
  },
  {
    id: '5',
    title: 'All Day Event',
    start: '2024-01-19',
    allDay: true,
  },
]

const sampleResources = [
  { id: 'a', title: 'Room A' },
  { id: 'b', title: 'Room B' },
  { id: 'c', title: 'Room C' },
]

const schedulerEvents = [
  {
    id: '1',
    resourceId: 'a',
    title: 'Morning Session',
    start: '2024-01-15T09:00:00',
    end: '2024-01-15T12:00:00',
  },
  {
    id: '2',
    resourceId: 'b',
    title: 'Training Workshop',
    start: '2024-01-15T10:00:00',
    end: '2024-01-15T13:00:00',
  },
  {
    id: '3',
    resourceId: 'a',
    title: 'Afternoon Meeting',
    start: '2024-01-15T14:00:00',
    end: '2024-01-15T16:00:00',
  },
  {
    id: '4',
    resourceId: 'c',
    title: 'Client Call',
    start: '2024-01-15T11:00:00',
    end: '2024-01-15T12:30:00',
  },
]

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            FullCalendar Shadcn Demo
          </h1>
          <p className="text-muted-foreground">
            Demonstrating EventCalendar and Scheduler components with Shadcn UI
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Event Calendar</h2>
          <EventCalendar
            events={sampleEvents}
            initialDate="2024-01-15"
            editable={true}
            selectable={true}
          />
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Scheduler</h2>
          <Scheduler
            events={schedulerEvents}
            resources={sampleResources}
            initialDate="2024-01-15"
            editable={true}
            selectable={true}
          />
        </div>
      </div>
    </div>
  )
}

export default App

