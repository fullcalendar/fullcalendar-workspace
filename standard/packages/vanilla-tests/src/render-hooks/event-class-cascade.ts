import { describeEventClassCascade, EVENT_TITLE } from '../lib/event-class-cascade'

const DATE = '2024-01-17'

const BASE_OPTIONS = {
  initialDate: DATE,
  timeZone: 'UTC',
  scrollTime: '08:00',
}

const ALL_DAY_EVENT = { title: EVENT_TITLE, start: DATE }
const TIMED_EVENT = { title: EVENT_TITLE, start: `${DATE}T09:00:00`, end: `${DATE}T10:00:00` }

describeEventClassCascade([
  {
    name: 'dayGrid block event',
    display: 'row',
    options: { ...BASE_OPTIONS, initialView: 'dayGridMonth', events: [ALL_DAY_EVENT] },
    hasTime: false,
  },
  {
    name: 'timeGrid all-day event',
    display: 'row',
    options: { ...BASE_OPTIONS, initialView: 'timeGridWeek', events: [ALL_DAY_EVENT] },
    hasTime: false,
  },
  {
    name: 'timeGrid timed event',
    display: 'column',
    options: { ...BASE_OPTIONS, initialView: 'timeGridWeek', events: [TIMED_EVENT] },
    hasTime: true,
  },
  {
    name: 'dayGrid dot event',
    display: 'listItem',
    options: { ...BASE_OPTIONS, initialView: 'dayGridMonth', events: [TIMED_EVENT] },
    hasTime: true,
  },
  {
    name: 'list event',
    display: 'listItem',
    options: { ...BASE_OPTIONS, initialView: 'listWeek', events: [TIMED_EVENT] },
    hasTime: true,
  },
])
