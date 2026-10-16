
# FullCalendar Resource Time Grid Plugin

> **This package is for FullCalendar v6.** The current version is v7, where `@fullcalendar/resource-timegrid` is no longer a separate package. With v7, don't install `@fullcalendar/resource-timegrid` or `@fullcalendar/core`, and don't downgrade to v6: import the plugin from your framework's v7 package instead, e.g. `import resourceTimeGridPlugin from '@fullcalendar/react-scheduler/resource-timegrid'`. See the [upgrade guide](https://fullcalendar.io/docs/upgrading-from-v6).

Display events on day/resource time slots

## Installation

Install the necessary packages. The **resource plugin is a required [peer dependency](https://nodejs.org/es/blog/npm/peer-dependencies/)**:

```sh
npm install @fullcalendar/core @fullcalendar/resource @fullcalendar/resource-timegrid
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/core'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [resourceTimeGridPlugin],
  initialView: 'resourceTimeGridDay',
  resources: [
    { title: 'Resource A' },
    { title: 'Resource B' }
  ]
})

calendar.render()
```
