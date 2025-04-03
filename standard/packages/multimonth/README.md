
# FullCalendar Multi-Month Plugin

Display multiple months, in a grid or vertical stack

## Installation

Install the necessary packages:

```sh
npm install @fullcalendar/core @fullcalendar/multimonth
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/core'
import multiMonthPlugin from '@fullcalendar/multimonth'
import classicThemePlugin from '@fullcalendar/classic-theme'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [multiMonthPlugin, classicThemePlugin],
  initialView: 'multiMonthYear',
  events: [
    { title: 'Meeting', start: new Date() }
  ]
})

calendar.render()
```
