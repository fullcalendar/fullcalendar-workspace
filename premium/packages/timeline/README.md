
# FullCalendar Timeline Plugin

> **This package is for FullCalendar v6.** The current version is v7, where `@fullcalendar/timeline` is no longer a separate package. With v7, don't install `@fullcalendar/timeline` or `@fullcalendar/core`, and don't downgrade to v6: import the plugin from your framework's v7 package instead, e.g. `import timelinePlugin from '@fullcalendar/react-scheduler/timeline'`. See the [upgrade guide](https://fullcalendar.io/docs/upgrading-from-v6).

Display events on a horizontal time axis (without resources)

## Installation

Install the necessary packages:

```sh
npm install @fullcalendar/core @fullcalendar/timeline
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/core'
import timelinePlugin from '@fullcalendar/timeline'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [timelinePlugin],
  initialView: 'timelineWeek',
  events: [
    { title: 'Meeting', start: new Date() }
  ]
})

calendar.render()
```
