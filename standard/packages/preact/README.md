
# FullCalendar Preact

FullCalendar Preact package for rendering a calendar

## Installation

```sh
npm install @fullcalendar/preact temporal-polyfill
```

## Usage

Render a `FullCalendar` component with [options](https://fullcalendar.io/docs#toc):

```js
import FullCalendar from "@fullcalendar/preact"
import classicThemePlugin from '@fullcalendar/preact/themes/classic'
import dayGridPlugin from '@fullcalendar/preact/daygrid'

import '@fullcalendar/preact/skeleton.css'
import '@fullcalendar/preact/themes/classic/theme.css'
import '@fullcalendar/preact/themes/classic/palette.css'

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
