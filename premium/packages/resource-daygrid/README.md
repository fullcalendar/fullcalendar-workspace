
# FullCalendar Resource Day Grid Plugin

> **This package is for FullCalendar v6.** The current version is v7, where `@fullcalendar/resource-daygrid` is no longer a separate package. With v7, don't install `@fullcalendar/resource-daygrid` or `@fullcalendar/core`, and don't downgrade to v6: import the plugin from your framework's v7 package instead, e.g. `import resourceDayGridPlugin from '@fullcalendar/react-scheduler/resource-daygrid'`. See the [upgrade guide](https://fullcalendar.io/docs/upgrading-from-v6).

Display events on day/resource columns

## Installation

Install the necessary packages. The **resource plugin is a required [peer dependency](https://nodejs.org/es/blog/npm/peer-dependencies/)**:

```sh
npm install @fullcalendar/core @fullcalendar/resource @fullcalendar/resource-daygrid
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/core'
import resourceDayGridPlugin from '@fullcalendar/resource-daygrid'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [resourceDayGridPlugin],
  initialView: 'resourceDayGridDay',
  resources: [
    { title: 'Resource A' },
    { title: 'Resource B' }
  ]
})

calendar.render()
```
