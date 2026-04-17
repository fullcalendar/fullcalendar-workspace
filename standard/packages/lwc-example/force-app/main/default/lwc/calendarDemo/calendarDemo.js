import { LightningElement } from 'lwc'

export default class CalendarDemo extends LightningElement {
  calendarOptions = {
    initialView: 'dayGridMonth',
    selectable: true,
    editable: true,
    events: [
      {
        id: 'demo-1',
        title: 'Design Review',
        start: '2026-04-14T10:00:00',
      },
      {
        id: 'demo-2',
        title: 'Release Cutoff',
        start: '2026-04-18',
        allDay: true,
      },
      {
        id: 'demo-3',
        title: 'Customer Workshop',
        start: '2026-04-21T13:00:00',
        end: '2026-04-21T15:00:00',
      },
    ],
  }

  handleEventClick(event) {
    window.console.log('FullCalendar eventClick', event.detail)
  }
}
