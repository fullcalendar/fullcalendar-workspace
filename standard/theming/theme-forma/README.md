
# FullCalendar Forma Theme

Display an event calendar with a [Fluent UI](https://developer.microsoft.com/en-us/fluentui#/) inspired theme.

## Installation

Install FullCalendar's core, the theme, and any other plugins you plan to use:

```sh
npm install @fullcalendar/core @fullcalendar/theme-forma @fullcalendar/daygrid
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/core'
import formaThemePlugin from '@fullcalendar/theme-forma'
import dayGridPlugin from '@fullcalendar/daygrid'

import '@fullcalendar/core/skeleton.css'
import '@fullcalendar/theme-forma/theme.css'
import '@fullcalendar/theme-forma/palettes/blue.css'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [formaThemePlugin, dayGridPlugin],
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
