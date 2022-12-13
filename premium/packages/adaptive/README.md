
# FullCalendar Adaptive Plugin

Optimizes FullCalendar for print (and soon other types of devices)

## Installation

Install the FullCalendar core package, the adaptive plugin, and any other plugins (like [daygrid](https://fullcalendar.io/docs/month-view)):

```sh
npm install @fullcalendar/core @fullcalendar/adaptive @fullcalendar/daygrid
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/core'
import adaptivePlugin from '@fullcalendar/adaptive'
import dayGridPlugin from '@fullcalendar/daygrid'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [
    adaptivePlugin,
    dayGridPlugin
  ],
  initialView: 'dayGridMonth'
})

calendar.render()
```
