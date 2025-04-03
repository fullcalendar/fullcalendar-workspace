
# FullCalendar List View Plugin

Display events on a calendar view that looks like a bulleted list

## Installation

Install the necessary packages:

```sh
npm install @fullcalendar/core @fullcalendar/list
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/core'
import listPlugin from '@fullcalendar/list'
import classicThemePlugin from '@fullcalendar/classic-theme'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [listPlugin, classicThemePlugin],
  initialView: 'listWeek',
  events: [
    { title: 'Meeting', start: new Date() }
  ]
})

calendar.render()
```
