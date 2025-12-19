
# FullCalendar RRule Plugin

Recurring events with [RRule](https://github.com/jakubroztocil/rrule)

## Installation

First, ensure the RRule lib is installed:

```sh
npm install rrule
```

Then, install the FullCalendar core package, the RRule plugin, and any other plugins (like [daygrid](https://fullcalendar.io/docs/month-view)):

```sh
npm install @fullcalendar/core @fullcalendar/rrule @fullcalendar/daygrid
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/core'
import rrulePlugin from '@fullcalendar/rrule'
import dayGridPlugin from '@fullcalendar/daygrid'
import classicThemePlugin from '@fullcalendar/theme-classic'

import '@fullcalendar/core/skeleton.css'
import '@fullcalendar/theme-classic/theme.css'
import '@fullcalendar/theme-classic/palette.css'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [
    rrulePlugin,
    dayGridPlugin,
    classicThemePlugin
  ],
  initialView: 'dayGridMonth',
  events: [
    {
      title: 'Meeting',
      rrule: {
        freq: 'weekly',
        byweekday: ['mo', 'fr']
      }
    }
  ]
})

calendar.render()
```
