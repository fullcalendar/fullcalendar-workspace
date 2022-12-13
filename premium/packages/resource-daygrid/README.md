
# FullCalendar Resource Day Grid Plugin

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
