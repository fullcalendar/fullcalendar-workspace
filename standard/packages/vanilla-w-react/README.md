
# FullCalendar VANILLA

FullCalendar core package for rendering a calendar

## Installation

```sh
npm install @fullcalendar/vanilla
```

## Usage

First, ensure there's a DOM element for your calendar to render into:

```html
<body>
  <div id='calendar'></div>
</body>
```

Then, instantiate a Calendar object with [options](https://fullcalendar.io/docs#toc) and call its `render` method:

```js
import { Calendar } from '@fullcalendar/vanilla'
import dayGridPlugin from '@fullcalendar/vanilla/daygrid'
import classicThemePlugin from '@fullcalendar/vanilla/themes/classic'

import '@fullcalendar/vanilla/skeleton.css'
import '@fullcalendar/vanilla/themes/classic/theme.css'
import '@fullcalendar/vanilla/themes/classic/palette.css'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [
    dayGridPlugin,
    classicThemePlugin,
    // any other plugins
  ],
  initialView: 'dayGridMonth',
  weekends: false,
  events: [
    { title: 'Meeting', start: new Date() }
  ]
})

calendar.render()
```
