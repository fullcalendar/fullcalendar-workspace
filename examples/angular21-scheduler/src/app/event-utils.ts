import { EventInput } from '@fullcalendar/angular';

export const INITIAL_EVENTS: EventInput[] = [
  {
    id: 'before',
    resourceId: 'r1',
    title: 'Starts before visible range',
    start: '2024-06-09T20:00:00',
    end: '2024-06-10T05:00:00',
  },
];

export const RESOURCES = [
  { id: 'r1', title: 'Resource A' },
];
