
# FullCalendar React

FullCalendar React package for rendering a calendar

## Installation

```sh
npm install @fullcalendar/react temporal-polyfill
```

## Usage

Render a `FullCalendar` component with [options](https://fullcalendar.io/docs#toc):

```js
import FullCalendar from "@fullcalendar/react"
import classicThemePlugin from '@fullcalendar/react/themes/classic'
import dayGridPlugin from '@fullcalendar/react/daygrid'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/classic/theme.css'
import '@fullcalendar/react/themes/classic/palette.css'

<FullCalendar
  plugins={[
    dayGridPlugin,
    classicThemePlugin,
    // any other plugins
  ]}
  initialView='dayGridMonth'
  weekends={false}
  events={[
    { title: 'Meeting', start: new Date() },
  ]}
/>
```
