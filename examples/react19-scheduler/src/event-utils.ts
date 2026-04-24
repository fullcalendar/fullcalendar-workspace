import { EventInput } from '@fullcalendar/react'

let eventGuid = 0
const todayStr = new Date().toISOString().replace(/T.*$/, '') // YYYY-MM-DD of today

export const INITIAL_EVENTS: EventInput[] = [
  {
    id: createEventId(),
    title: 'All-day event',
    start: todayStr,
    resourceId: 'a',
  },
  {
    id: createEventId(),
    title: 'Timed event',
    start: todayStr + 'T12:00:00',
    resourceId: 'b',
  }
]

export function createEventId() {
  return String(eventGuid++)
}

export const RESOURCES = [
  { id: 'a', title: 'Auditorium A' },
  { id: 'b', title: 'Auditorium B', eventColor: 'green' },
  { id: 'c', title: 'Auditorium C', eventColor: 'orange' },
]
