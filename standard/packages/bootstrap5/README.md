# FullCalendar Bootstrap 5 Plugin

A backwards-compatible Bootstrap 5 theme for FullCalendar.

## Installation

Install the plugin together with Bootstrap 5 and Bootstrap Icons:

```sh
npm install @fullcalendar/bootstrap5 bootstrap@5 bootstrap-icons
```

## Usage

Import the plugin and styles, then add the plugin to the calendar's `plugins` array:

```js
import bootstrap5Plugin from '@fullcalendar/bootstrap5'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '@fullcalendar/bootstrap5/theme.css'
import '@fullcalendar/bootstrap5/palette.css'

const calendarOptions = {
  plugins: [bootstrap5Plugin],
}
```

The same plugin works with the FullCalendar Preact, React, Vue, Angular, and Vanilla connectors.
