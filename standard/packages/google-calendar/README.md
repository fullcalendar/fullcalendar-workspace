
# FullCalendar Google Calendar Plugin

Display events from a public [Google Calendar feed](https://support.google.com/calendar/answer/37648?hl=en)

## Installation

Install the FullCalendar vanilla-JS package, the Google Calendar plugin, and any other plugins (like [daygrid](https://fullcalendar.io/docs/month-view)):

```sh
npm install @fullcalendar/vanilla @fullcalendar/google-calendar
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/vanilla'
import classicThemePlugin from '@fullcalendar/vanilla/themes/classic'
import dayGridPlugin from '@fullcalendar/vanilla/daygrid'
import googleCalendarPlugin from '@fullcalendar/google-calendar'

import '@fullcalendar/vanilla/skeleton.css'
import '@fullcalendar/vanilla/themes/classic/theme.css'
import '@fullcalendar/vanilla/themes/classic/palette.css'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [
    googleCalendarPlugin,
    dayGridPlugin,
    classicThemePlugin
  ],
  initialView: 'dayGridMonth',
  events: {
    googleCalendarId: 'abcd1234@group.calendar.google.com'
  }
})

calendar.render()
```
