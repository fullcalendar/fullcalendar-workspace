
# FullCalendar Monarch Theme

Display an event calendar with a [Material Design](https://m3.material.io/) inspired theme.

## Installation

Install FullCalendar's core, the theme, and any other plugins you plan to use:

```sh
npm install @fullcalendar/core @fullcalendar/theme-monarch @fullcalendar/daygrid
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/core'
import monarchThemePlugin from '@fullcalendar/theme-monarch'
import dayGridPlugin from '@fullcalendar/daygrid'

import '@fullcalendar/core/skeleton.css'
import '@fullcalendar/theme-monarch/theme.css'
import '@fullcalendar/theme-monarch/palettes/purple.css'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [monarchThemePlugin, dayGridPlugin],
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
