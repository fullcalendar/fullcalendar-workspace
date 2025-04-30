import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import themePlugin from './theme'
import './style.css'

document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar')!

  var calendar = new Calendar(calendarEl, {
    // stickyHeaderDates: true, -- makes things broken sometimes!
    weekNumbers: true,
    plugins: [
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
      interactionPlugin,
      themePlugin,
    ],
    initialDate: '2023-01-12',
    initialView: 'listWeek',
    nowIndicator: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    navLinks: true, // can click day/week names to navigate views
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true, // allow "more" link when too many events
    // businessHours: true, // looks whack, covering lots of things
    eventMaxStack: 1,
    events: [
      {
        title: 'All Day Event',
        start: '2023-01-01',
      },
      {
        title: 'Long Event',
        start: '2023-01-07',
        end: '2023-01-10'
      },
      {
        groupId: '999',
        title: 'Repeating Event',
        start: '2023-01-09T16:00:00'
      },
      {
        groupId: '999',
        title: 'Repeating Event',
        start: '2023-01-16T16:00:00'
      },
      {
        title: 'Conference',
        start: '2023-01-11',
        end: '2023-01-13',
        display: 'background',
      },
      {
        title: 'Meeting',
        start: '2023-01-12T12:00:00'
      },
      {
        title: 'Lunch',
        start: '2023-01-12T12:00:00'
      },
      {
        title: 'Meeting',
        start: '2023-01-12T14:30:00'
      },
      {
        title: 'Happy Hour',
        start: '2023-01-12T17:30:00'
      },
      {
        title: 'Dinner',
        start: '2023-01-12T20:00:00'
      },
      {
        title: 'Birthday Party',
        start: '2023-01-13T07:00:00'
      },
      {
        title: 'Click for Google',
        url: 'http://google.com/',
        start: '2023-01-28'
      }
    ]
  })

  calendar.render()
})
