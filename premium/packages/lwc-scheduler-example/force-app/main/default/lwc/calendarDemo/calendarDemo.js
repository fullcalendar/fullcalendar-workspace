import { LightningElement } from 'lwc'

export default class CalendarDemo extends LightningElement {
  calendarOptions = {
    initialDate: '2026-07-15',
    initialView: 'resourceTimelineWeek',
    schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
    editable: true,
    resourceColumnHeaderContent: 'Rooms',
    resources: [
      { id: 'room-a', title: 'Room A' },
      { id: 'room-b', title: 'Room B' },
      { id: 'room-c', title: 'Room C' },
    ],
    events: [
      {
        id: 'demo-1',
        resourceId: 'room-a',
        title: 'Design Review',
        start: '2026-07-15T10:00:00',
        end: '2026-07-15T12:00:00',
      },
      {
        id: 'demo-2',
        resourceId: 'room-b',
        title: 'Customer Workshop',
        start: '2026-07-16T13:00:00',
        end: '2026-07-16T16:00:00',
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
