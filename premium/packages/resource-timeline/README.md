
# FullCalendar Resource Timeline Plugin

> **This package is for FullCalendar v6.** The current version is v7, where `@fullcalendar/resource-timeline` is no longer a separate package. With v7, don't install `@fullcalendar/resource-timeline` or `@fullcalendar/core`, and don't downgrade to v6: import the plugin from your framework's v7 package instead, e.g. `import resourceTimelinePlugin from '@fullcalendar/react-scheduler/resource-timeline'`. See the [upgrade guide](https://fullcalendar.io/docs/upgrading-from-v6).

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
