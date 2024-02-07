import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function DemoApp() {
  const [events, setEvents] = useState([
    {
      id: 'ID_1',
      start: '2020-08-28T12:00:00',
      end: '2020-08-28T15:00:00',
      title: 'event 1',
    },
  ])

  const eventDrop = (info) => {
    console.log('eventDrop info', info);

    const newEvents = events.map((e) => {
      if (e.id === info.event.id) {
        return {
          ...info.event.toPlainObject(), // important!
          start: info.event.start,
          end: info.event.end,
        }
      }
      return e
    })

    console.log('newEvents', newEvents)

    sleep(2000).then(() => {
      setEvents(newEvents)
    })
  }

  console.log('state events', events)

  return (
    <div className='demo-app'>
      <div className='demo-app-main'>
        <FullCalendar
          events={events}
          eventDrop={eventDrop}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          initialView='timeGridWeek'
          initialDate='2020-08-28'
          editable={true}
          selectable={true}
          selectMirror={true}
        />
      </div>
    </div>
  )
}
