
# FullCalendar Resource Timeline Plugin

Display events and resources on a horizontal time axis

## Installation

Install the necessary packages. The **resource plugin is a required [peer dependency](https://nodejs.org/es/blog/npm/peer-dependencies/)**:

```sh
npm install @fullcalendar/core @fullcalendar/resource @fullcalendar/resource-timeline
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/core'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [resourceTimelinePlugin],
  initialView: 'resourceTimelineWeek',
  resources: [
    { title: 'Resource A' },
    { title: 'Resource B' }
  ]
})

calendar.render()
```
