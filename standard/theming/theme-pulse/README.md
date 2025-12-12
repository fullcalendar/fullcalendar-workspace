
# FullCalendar Monarch Theme

Display an event calendar with a Zen-like theme, with a pop of color.

## Installation

Install FullCalendar's core, the theme, and any other plugins you plan to use:

```sh
npm install @fullcalendar/core @fullcalendar/theme-pulse @fullcalendar/daygrid
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/core'
import pulseThemePlugin from '@fullcalendar/theme-pulse'
import dayGridPlugin from '@fullcalendar/daygrid'

import '@fullcalendar/core/global.css'
import '@fullcalendar/theme-pulse/global.css'
import '@fullcalendar/theme-pulse/palettes/red.css'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [pulseThemePlugin, dayGridPlugin],
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
