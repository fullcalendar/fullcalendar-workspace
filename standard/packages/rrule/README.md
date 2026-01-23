
# FullCalendar RRule Plugin

Recurring events with [RRule](https://github.com/jakubroztocil/rrule)

## Installation

First, ensure the RRule lib is installed:

```sh
npm install rrule
```

Then, install the FullCalendar vanilla-JS package and the RRule plugin:

```sh
npm install @fullcalendar/vanilla @fullcalendar/rrule
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/vanilla'
import dayGridPlugin from '@fullcalendar/vanilla/daygrid'
import classicThemePlugin from '@fullcalendar/vanilla/themes/classic'
import rrulePlugin from '@fullcalendar/rrule'

import '@fullcalendar/vanilla/skeleton.css'
import '@fullcalendar/vanilla/themes/classic/theme.css'
import '@fullcalendar/vanilla/themes/classic/palette.css'

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
