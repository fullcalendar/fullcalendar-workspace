
# FullCalendar Moment Plugin

Enhanced date formatting and conversion with [Moment](https://momentjs.com/)

## Installation

First, ensure Moment is installed:

```sh
npm install moment
```

Then, install the FullCalendar core package, the Moment plugin, and any other plugins (like [daygrid](https://fullcalendar.io/docs/month-view)):

```sh
npm install @fullcalendar/vanilla @fullcalendar/moment
```

## Usage

Instantiate a Calendar with the necessary plugin:

```js
import { Calendar } from '@fullcalendar/vanilla'
import classicThemePlugin from '@fullcalendar/vanilla/themes/classic'
import dayGridPlugin from '@fullcalendar/vanilla/daygrid'
import momentPlugin from '@fullcalendar/moment'

import '@fullcalendar/vanilla/skeleton.css'
import '@fullcalendar/vanilla/themes/classic/theme.css'
import '@fullcalendar/vanilla/themes/classic/palette.css'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [
    momentPlugin,
    dayGridPlugin,
    classicThemePlugin
  ],
  initialView: 'dayGridMonth',
  titleFormat: 'MMMM D, YYYY' // use Moment format strings
})

calendar.render()
```
