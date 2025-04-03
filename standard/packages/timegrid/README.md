
# FullCalendar Time Grid Plugin

Display events on time slots

## Installation

Install the necessary packages:

```sh
npm install @fullcalendar/core @fullcalendar/timegrid
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/core'
import timeGridPlugin from '@fullcalendar/timegrid'
import classicThemePlugin from '@fullcalendar/classic-theme'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [timeGridPlugin, classicThemePlugin],
  initialView: 'timeGridWeek',
  events: [
    { title: 'Meeting', start: new Date() }
  ]
})

calendar.render()
```
