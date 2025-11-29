import { CalendarOptions } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'

export interface EventCalendarProps extends CalendarOptions {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export const eventCalendarPlugins = [
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  interactionPlugin,
  multiMonthPlugin,
]

export const eventCalendarAvailableViews = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'listWeek',
  'multiMonthYear',
]

export const eventCalendarProps: EventCalendarProps = {
  // dayMinWidth: 200
  // slotMaxTime: '08:00:00'
  // expandRows: true
  // height: 'auto'
  // stickyHeaderDates: false
  // dayPopoverFormat: { weekday: 'long' }
  // dayHeaderFormat: { weekday: 'long' }
  eventStartEditable: true,
  eventResizableFromStart: true,
  // direction: 'rtl'
  // displayEventTime: true
  // eventDisplay: 'block'
  // allDaySlot: false
  addButton: {
    text: 'Add Event',
    click: () => {
      alert('add event...')
    }
  },
  navLinkDayClick: 'timeGridDay',
  navLinkWeekClick: 'timeGridWeek',
  schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives', // for extra plugins
  weekNumbers: true,

  eventInteractive: true,
  // multiMonthMaxColumns: 1
  nowIndicator: true,
  navLinks: true,
  editable: true,
  selectable: true,
  selectMirror: false,
  dayMaxEvents: true,
  // businessHours: true // -- TODO: background conflicts with the week number pills!!!
  eventMaxStack: 1,
  // // for testing pill-like day-numbers
  // dayCellFormat: {
  //   month: "short", // gives Jan, Feb, Mar, ...
  //   day: "numeric"  // gives 1, 2, 3, ...
  // }
  // dayHeaderFormat: {
  //   weekday: 'short',
  // }
  // events: 'https://fullcalendar.io/api/demo-feeds/events.json?overload-day'
  now: '2025-07-04T12:00:00',
  timeZone: 'UTC',
  events: [
    {
      "title": "All Day Event",
      "start": "2025-07-01",
      color: 'pink',
      contrastColor: '#000',
    },
    {
      "title": "Long Event",
      "start": "2025-07-07",
      "end": "2025-07-17",
      // "color": "var(--color-pink-500)",
    },
    {
      "groupId": "999",
      "title": "Repeating Event",
      "start": "2025-07-09T16:00:00+00:00"
    },
    {
      "groupId": "999",
      "title": "Repeating Event",
      "start": "2025-07-16T16:00:00+00:00"
    },
    {
      "title": "Conference",
      "start": "2025-07-03",
      "end": "2025-07-05",
      // display: 'background',
    },
    {
      "title": "Meeting",
      "start": "2025-07-04T10:30:00+00:00",
      "end": "2025-07-04T12:30:00+00:00"
    },
    {
      "title": "Lunch",
      "start": "2025-07-04T12:00:00+00:00"
    },
    {
      "title": "Birthday Party",
      "start": "2025-07-05T07:00:00+00:00"
    },
    {
      "url": "http:\/\/google.com\/",
      "title": "Click for Google",
      "start": "2025-07-28"
    },
    {
      "title": "Meeting",
      "start": "2025-07-01T08:30:00+00:00",
      "end": "2025-07-01T16:30:00+00:00",
      // "end": "2025-07-01T09:00:00+00:00", // for isShort
      "display": "background",
      // "color": "red",
    },
    // {
    //   "title": "Meeting",
    //   "start": "2025-07-04T08:30:00+00:00",
    //   "end": "2025-07-04T16:30:00+00:00",
    //   "display": "background",
    //   // "color": "red",
    // },
    {
      "title": "Happy Hour",
      "start": "2025-07-04T17:30:00+00:00"
    },
    {
      "title": "Dinner",
      "start": "2025-07-04T20:00:00+00:00"
    }
  ]
}
