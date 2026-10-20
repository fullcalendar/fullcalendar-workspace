import { describeEventClassCascade, EVENT_TITLE } from '@fullcalendar-tests/standard/lib/event-class-cascade'

const DATE = '2024-01-17'

describeEventClassCascade([
  {
    name: 'timeline event',
    display: 'row',
    options: {
      initialDate: DATE,
      timeZone: 'UTC',
      scrollTime: '08:00',
      initialView: 'timelineMonth', // a day scale, so the event shows its time
      events: [{ title: EVENT_TITLE, start: `${DATE}T09:00:00`, end: `${DATE}T10:00:00` }],
    },
    hasTime: true,
  },
])
