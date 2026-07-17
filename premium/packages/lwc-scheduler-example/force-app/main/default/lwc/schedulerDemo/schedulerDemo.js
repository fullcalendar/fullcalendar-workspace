import { LightningElement, api } from 'lwc'

export default class SchedulerDemo extends LightningElement {
  @api themeAndPalette = 'Forma / Blue'
  @api locale = 'en'

  calendarOptions = {
    timeZone: 'UTC',
    initialDate: '2026-07-17',
    initialView: 'resourceTimelineDay',
    aspectRatio: 1.5,
    headerToolbar: {
      left: 'prev,next',
      center: 'title',
      right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth',
    },
    editable: true,
    resourceColumnHeaderContent: 'Rooms',
    resources: [
      { id: 'a', title: 'Auditorium A' },
      { id: 'b', title: 'Auditorium B', eventColor: 'green' },
      { id: 'c', title: 'Auditorium C', eventColor: 'orange' },
      {
        id: 'd',
        title: 'Auditorium D',
        children: [
          { id: 'd1', title: 'Room D1' },
          { id: 'd2', title: 'Room D2' },
        ],
      },
      { id: 'e', title: 'Auditorium E' },
      { id: 'f', title: 'Auditorium F', eventColor: 'red' },
      { id: 'g', title: 'Auditorium G' },
      { id: 'h', title: 'Auditorium H' },
      { id: 'i', title: 'Auditorium I' },
      { id: 'j', title: 'Auditorium J' },
      { id: 'k', title: 'Auditorium K' },
      { id: 'l', title: 'Auditorium L' },
      { id: 'm', title: 'Auditorium M' },
      { id: 'n', title: 'Auditorium N' },
      { id: 'o', title: 'Auditorium O' },
      { id: 'p', title: 'Auditorium P' },
      { id: 'q', title: 'Auditorium Q' },
      { id: 'r', title: 'Auditorium R' },
      { id: 's', title: 'Auditorium S' },
      { id: 't', title: 'Auditorium T' },
      { id: 'u', title: 'Auditorium U' },
      { id: 'v', title: 'Auditorium V' },
      { id: 'w', title: 'Auditorium W' },
      { id: 'x', title: 'Auditorium X' },
      { id: 'y', title: 'Auditorium Y' },
      { id: 'z', title: 'Auditorium Z' },
    ],
    events: [
      {
        resourceId: 'd',
        title: 'event 1',
        start: '2026-07-16',
        end: '2026-07-18',
      },
      {
        resourceId: 'c',
        title: 'event 3',
        start: '2026-07-17T12:00:00+00:00',
        end: '2026-07-18T06:00:00+00:00',
      },
      {
        resourceId: 'f',
        title: 'event 4',
        start: '2026-07-17T07:30:00+00:00',
        end: '2026-07-17T09:30:00+00:00',
      },
      {
        resourceId: 'b',
        title: 'event 5',
        start: '2026-07-17T10:00:00+00:00',
        end: '2026-07-17T15:00:00+00:00',
      },
      {
        resourceId: 'e',
        title: 'event 2',
        start: '2026-07-17T09:00:00+00:00',
        end: '2026-07-17T14:00:00+00:00',
      },
    ],
  }

  handleEventClick(event) {
    window.console.log('FullCalendar Scheduler eventClick', event.detail)
  }

  handleResourceAdd(event) {
    window.console.log('FullCalendar Scheduler resourceAdd', event.detail)
  }
}
