
# FullCalendar Classic Theme

Display an event calendar with FullCalendar's classic theme

## Installation

Install FullCalendar's core, the theme, and any other plugins you plan to use:

```sh
npm install @fullcalendar/core @fullcalendar/theme-classic @fullcalendar/daygrid
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/core'
import classicThemePlugin from '@fullcalendar/theme-classic'
import dayGridPlugin from '@fullcalendar/daygrid'

import '@fullcalendar/core/skeleton.css'
import '@fullcalendar/theme-classic/theme.css'
import '@fullcalendar/theme-classic/palette.css'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [classicThemePlugin, dayGridPlugin],
  initialView: 'dayGridMonth',
  events: [
    { title: 'Meeting', start: new Date() }
  ]
})

calendar.render()
```

## Colors

Future docs will explain how to customize this theme's colors, as well as light/dark mode.

## React/Vue/Angular Usage

Future docs will explain how to use this theme with various front-end frameworks.
