
# FullCalendar Adaptive Plugin

> **This package is for FullCalendar v6.** The current version is v7, where `@fullcalendar/adaptive` is no longer a separate package. With v7, don't install `@fullcalendar/adaptive` or `@fullcalendar/core`, and don't downgrade to v6: import the plugin from your framework's v7 package instead, e.g. `import adaptivePlugin from '@fullcalendar/react-scheduler/adaptive'`. See the [upgrade guide](https://fullcalendar.io/docs/upgrading-from-v6).

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
