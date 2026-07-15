import { useState } from 'preact/hooks'
import {
  EventApi,
  DateSelectInfo,
  EventClickInfo,
  EventDisplayInfo,
  formatDate,
} from '@fullcalendar/preact'
import FullCalendar from '@fullcalendar/preact'
import themePlugin from '@fullcalendar/preact/themes/classic'
import adaptivePlugin from '@fullcalendar/preact-scheduler/adaptive'
import dayGridPlugin from '@fullcalendar/preact/daygrid'
import timeGridPlugin from '@fullcalendar/preact/timegrid'
import interactionPlugin from '@fullcalendar/preact/interaction'
import resourceTimelinePlugin from '@fullcalendar/preact-scheduler/resource-timeline'
import { RESOURCES, INITIAL_EVENTS, createEventId } from './event-utils'

import '@fullcalendar/preact/skeleton.css'
import '@fullcalendar/preact/themes/classic/theme.css'
import '@fullcalendar/preact/themes/classic/palette.css'

interface SidebarProps {
  weekendsVisible: boolean
  handleWeekendsToggle: () => void
  handlePrint: () => void
  currentEvents: EventApi[]
}

export default function DemoApp() {
  const [weekendsVisible, setWeekendsVisible] = useState(true)
  const [currentEvents, setCurrentEvents] = useState<EventApi[]>([])

  function handleWeekendsToggle() {
    setWeekendsVisible(!weekendsVisible)
  }

  function handleDateSelect(selectInfo: DateSelectInfo) {
    let title = prompt('Please enter a new title for your event')
    let calendarApi = selectInfo.view.calendar

    calendarApi.unselect() // clear date selection

    if (title) {
      calendarApi.addEvent({
        id: createEventId(),
        resourceId: selectInfo.resource?.id,
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay
      })
    }
  }

  function handleEventClick(clickInfo: EventClickInfo) {
    if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
      clickInfo.event.remove()
    }
  }

  function handleEvents(events: EventApi[]) {
    setCurrentEvents(events)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className='demo-app'>
      <Sidebar
        weekendsVisible={weekendsVisible}
        handleWeekendsToggle={handleWeekendsToggle}
        handlePrint={handlePrint}
        currentEvents={currentEvents}
      />
      <div className='demo-app-main'>
        <FullCalendar
          plugins={[
            themePlugin,
            adaptivePlugin,
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            resourceTimelinePlugin,
          ]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,resourceTimelineDay'
          }}
          initialView='resourceTimelineDay'
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={weekendsVisible}
          initialEvents={INITIAL_EVENTS} // alternatively, use the `events` setting to fetch from a feed
          resources={RESOURCES}
          select={handleDateSelect}
          eventContent={renderEventContent} // custom render function
          eventClick={handleEventClick}
          eventsSet={handleEvents} // called after events are initialized/added/changed/removed
          /* you can update a remote database when these fire:
          eventAdd={function(){}}
          eventChange={function(){}}
          eventRemove={function(){}}
          */
        />
      </div>
    </div>
  )
}

function renderEventContent(eventInfo: EventDisplayInfo) {
  return (
    <>
      <b>{eventInfo.timeText}</b>
      <i>{eventInfo.event.title}</i>
    </>
  )
}

function Sidebar({ weekendsVisible, handleWeekendsToggle, handlePrint, currentEvents }: SidebarProps) {
  return (
    <div className='demo-app-sidebar'>
      <div className='demo-app-sidebar-section'>
        <h2>Instructions</h2>
        <ul>
          <li>Select dates and you will be prompted to create a new event</li>
          <li>Drag, drop, and resize events</li>
          <li>Click an event to delete it</li>
        </ul>
      </div>
      <div className='demo-app-sidebar-section'>
        <label>
          <input
            type='checkbox'
            checked={weekendsVisible}
            onChange={handleWeekendsToggle}
          ></input>
          toggle weekends
        </label>
      </div>
      <div className='demo-app-sidebar-section'>
        <button onClick={handlePrint}>Print</button>
      </div>
      <div className='demo-app-sidebar-section'>
        <h2>All Events ({currentEvents.length})</h2>
        <ul>
          {currentEvents.map((event) => (
            <SidebarEvent key={event.id} event={event} />
          ))}
        </ul>
      </div>
    </div>
  )
}

function SidebarEvent({ event }: { event: EventApi }) {
  return (
    <li key={event.id}>
      <b>{formatDate(event.start!, {year: 'numeric', month: 'short', day: 'numeric'})}</b>
      <i>{event.title}</i>
    </li>
  )
}
