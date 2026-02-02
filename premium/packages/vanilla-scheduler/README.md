
# FullCalendar Scheduler (Vanilla JS)

## Installation

```sh
npm install fullcalendar fullcalendar-scheduler
```

## Usage

Instantiate a Calendar with plugins and options:

```js
import { Calendar } from 'fullcalendar'
import classicThemePlugin from 'fullcalendar/themes/classic'
import interactionPlugin from 'fullcalendar/interaction'
import resourceTimelinePlugin from 'fullcalendar-scheduler/resource-timeline'

import 'fullcalendar/skeleton.css'
import 'fullcalendar/themes/classic/theme.css'
import 'fullcalendar/themes/classic/palette.css'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [
    classicThemePlugin,
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
