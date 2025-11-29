import { CalendarOptions } from '@fullcalendar/core'
import adaptivePlugin from '@fullcalendar/adaptive'
import scrollGridPlugin from '@fullcalendar/scrollgrid'
import timelinePlugin from '@fullcalendar/timeline'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'

export interface SchedulerProps extends CalendarOptions {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export const schedulerOnlyPlugins = [
  adaptivePlugin,
  scrollGridPlugin,
  timelinePlugin,
  resourceTimelinePlugin,
  resourceTimeGridPlugin,
  resourceDayGridPlugin,
]

export const schedulerAvailableViews = [
  'resourceTimelineDay',
  'resourceTimelineWeek',
]

export const schedulerProps: SchedulerProps = {
  now: '2025-07-04T12:00:00',
  // eventOverlap: false
  // datesAboveResources: true
  weekNumbers: true,
  navLinks: true,
  // height: 'auto'
  // stickyHeaderDates: false
  eventStartEditable: true,
  eventResizableFromStart: true,
  // direction: 'rtl'
  // weekNumbers: true
  addButton: {
    text: 'Add Event',
    click: () => [
      alert('add event...')
    ]
  },
  // displayEventTime: true
  eventMaxStack: 1,
  navLinkDayClick: 'resourceTimelineDay',
  navLinkWeekClick: 'resourceTimelineWeek',
  schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
  timeZone: 'UTC',
  dayMinWidth: 200,
  editable: true,
  selectable: true,
  nowIndicator: true,
  aspectRatio: 1.6,
  scrollTime: '07:00',
  eventInteractive: true,
}

export const abcResources = [
  { id: 'a', building: '460 Bryant', title: 'Auditorium A', occupancy: 40 },
  { id: 'b', building: '460 Bryant', title: 'Auditorium B', occupancy: 40, eventColor: 'green' },
  { id: 'c', building: '460 Bryant', title: 'Auditorium C', occupancy: 40, eventColor: 'orange' },
]

export const allResources = [
  ...abcResources,
  {
    id: 'd',
    building: '460 Bryant',
    title: 'Auditorium D',
    occupancy: 40,
    children: [
      { id: 'd1', title: 'Room D1', occupancy: 10 },
      { id: 'd2', title: 'Room D2', occupancy: 10 },
    ],
  },
  { id: 'e', building: '460 Bryant', title: 'Auditorium E', occupancy: 40 },
  { id: 'f', building: '460 Bryant', title: 'Auditorium F', occupancy: 40, eventColor: 'red' },
  { id: 'g', building: '564 Pacific', title: 'Auditorium G', occupancy: 40 },
  { id: 'h', building: '564 Pacific', title: 'Auditorium H', occupancy: 40 },
  { id: 'i', building: '564 Pacific', title: 'Auditorium I', occupancy: 40 },
  { id: 'j', building: '564 Pacific', title: 'Auditorium J', occupancy: 40 },
  { id: 'k', building: '564 Pacific', title: 'Auditorium K', occupancy: 40 },
  { id: 'l', building: '564 Pacific', title: 'Auditorium L', occupancy: 40 },
  { id: 'm', building: '564 Pacific', title: 'Auditorium M', occupancy: 40 },
  { id: 'n', building: '564 Pacific', title: 'Auditorium N', occupancy: 40 },
  { id: 'o', building: '564 Pacific', title: 'Auditorium O', occupancy: 40 },
  { id: 'p', building: '564 Pacific', title: 'Auditorium P', occupancy: 40 },
  { id: 'q', building: '564 Pacific', title: 'Auditorium Q', occupancy: 40 },
  { id: 'r', building: '564 Pacific', title: 'Auditorium R', occupancy: 40 },
  { id: 's', building: '564 Pacific', title: 'Auditorium S', occupancy: 40 },
  { id: 't', building: '564 Pacific', title: 'Auditorium T', occupancy: 40 },
  { id: 'u', building: '564 Pacific', title: 'Auditorium U', occupancy: 40 },
  { id: 'v', building: '564 Pacific', title: 'Auditorium V', occupancy: 40 },
  { id: 'w', building: '564 Pacific', title: 'Auditorium W', occupancy: 40 },
  { id: 'x', building: '564 Pacific', title: 'Auditorium X', occupancy: 40 },
  { id: 'y', building: '564 Pacific', title: 'Auditorium Y', occupancy: 40 },
  { id: 'z', building: '564 Pacific', title: 'Auditorium Z', occupancy: 40 },
]


export const abcResourceEvents = [
  {
    "title": "Meeting",
    "start": "2025-07-04T10:30:00+00:00",
    "end": "2025-07-04T12:30:00+00:00",
    "resourceId": "a",
  },
  {
    "title": "Lunch",
    "start": "2025-07-04T12:00:00+00:00",
    "resourceId": "a",
  },
]

export const allResourceEvents = [
  ...abcResourceEvents,
  {
    "resourceId": "d",
    "title": "event 1",
    "start": "2025-07-03",
    "end": "2025-07-05"
  },
  {
    "resourceId": "c",
    "title": "event 3",
    "start": "2025-07-04T12:00:00+00:00",
    "end": "2025-07-05T06:00:00+00:00"
  },
  {
    "resourceId": "f",
    "title": "event 4",
    "start": "2025-07-04T07:30:00+00:00",
    "end": "2025-07-04T09:30:00+00:00"
  },
  {
    "resourceId": "b",
    "title": "event 5",
    "start": "2025-07-04T10:00:00+00:00",
    "end": "2025-07-04T15:00:00+00:00"
  },
  {
    "resourceId": "e",
    "title": "event 2",
    "start": "2025-07-04T09:00:00+00:00",
    "end": "2025-07-04T14:00:00+00:00"
  }
]

export const vResourceProps: SchedulerProps = {
  ...schedulerProps,
  resources: abcResources,
  events: abcResourceEvents,
  buttons: {
    resourceTimeGridTwoDay: {
      text: '2-Day',
    },
    resourceTimeGridFiveDay: {
      text: '5-Day',
    }
  },
  views: {
    resourceTimeGridTwoDay: {
      type: 'resourceTimeGrid',
      duration: { days: 2 },
    },
    resourceTimeGridFiveDay: {
      type: 'resourceTimeGrid',
      duration: { days: 5 },
    },
    resourceDayGridFiveDay: {
      type: 'resourceDayGrid',
      duration: { days: 5 },
    }
  },
}

export const resourceTimelineProps: SchedulerProps = {
  ...schedulerProps,
  resources: allResources,
  events: allResourceEvents,
  buttons: {
    resourceTimelineThreeDay: {
      text: '3-Day',
    },
  },
  resourceColumnHeaderContent: 'Rooms',
  resourceColumnsWidth: '40%',
  resourceGroupField: 'building',
  resourceColumns: [
    { headerContent: 'Building', field: 'building' },
    { headerContent: 'Room', field: 'title' },
    { headerContent: 'Occupancy', field: 'occupancy' },
  ],
  views: {
    resourceTimelineThreeDay: {
      type: 'resourceTimeline',
      duration: { days: 3 },
      // slotDuration: { days: 1 },
    },
    resourceTimeline: {
      slotDuration: '01:00',
      snapDuration: '00:30',
    },
    resourceTimelineWeek: {
      // slotDuration: { days: 1 },
      slotHeaderInterval: { hours: 3 },
    },
  },
}
