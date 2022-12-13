
# FullCalendar Scheduler

Premium full-sized drag & drop calendar/scheduler in JavaScript

- [Project Website](https://fullcalendar.io/pricing)
- [Documentation](https://fullcalendar.io/docs/premium)
- [Support](https://fullcalendar.io/support)
- [License](https://fullcalendar.io/scheduler/license)
- [Roadmap](https://fullcalendar.io/roadmap)

## Installation

Install the FullCalendar core package and any plugins you plan to use:

```sh
npm install \
  @fullcalendar/core \
  @fullcalendar/interaction \
  @fullcalendar/resource \
  @fullcalendar/resource-timeline
```

## Usage

Instantiate a Calendar with plugins and options:

```js
import { Calendar } from '@fullcalendar/core'
import interactionPlugin from '@fullcalendar/interaction'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [
    interactionPlugin,
    resourceTimelinePlugin
  ],
  initialView: 'resourceTimelineWeek',
  editable: true,
  events: [
    { id: '1', resourceId: 'a', title: 'Meeting', start: new Date() }
  ],
  resources: [
    { id: 'a', title: 'Resource A' },
    { id: 'b', title: 'Resource B' }
  ]
})

calendar.render()
```
