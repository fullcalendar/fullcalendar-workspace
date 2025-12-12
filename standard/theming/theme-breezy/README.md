
# FullCalendar Breezy Theme

Display an event calendar with a [Tailwind Plus](https://tailwindcss.com/plus/ui-blocks/application-ui/data-display/calendars) inspired theme.

## Installation

Install FullCalendar's core, the theme, and any other plugins you plan to use:

```sh
npm install @fullcalendar/core @fullcalendar/theme-breezy @fullcalendar/daygrid
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/core'
import breezyThemePlugin from '@fullcalendar/theme-breezy'
import dayGridPlugin from '@fullcalendar/daygrid'

import '@fullcalendar/core/global.css'
import '@fullcalendar/theme-breezy/global.css'
import '@fullcalendar/theme-breezy/palettes/indigo.css'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [breezyThemePlugin, dayGridPlugin],
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
