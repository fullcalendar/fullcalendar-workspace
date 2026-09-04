
# FullCalendar Scheduler (Vanilla JS)

FullCalendar Vanilla JS Scheduler package, for rendering resource views

## Installation

```sh
npm install fullcalendar fullcalendar-scheduler temporal-polyfill
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
import { Calendar } from 'fullcalendar'
import classicThemePlugin from 'fullcalendar/themes/classic'
import interactionPlugin from 'fullcalendar/interaction'
import resourceTimelinePlugin from 'fullcalendar-scheduler/resource-timeline'

import 'fullcalendar/skeleton.css'
import 'fullcalendar/themes/classic/theme.css'
import 'fullcalendar/themes/classic/palette.css'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [
    classicThemePlugin,
    interactionPlugin,
    resourceTimelinePlugin
  ],
  initialView: 'resourceTimelineWeek',
  schedulerLicenseKey: 'YOUR-LICENSE-KEY',
  editable: true,
  events: [
    { id: '1', resourceId: 'a', title: 'Meeting', start: new Date() }
  ],
  resources: [
    { id: 'a', title: 'Resource A' },
    { id: 'b', title: 'Resource B' }
  ]
})

calendar.render()
```

## Plugins

| Import                                            | Provides                                                 |
| ------------------------------------------------- | -------------------------------------------------------- |
| `fullcalendar-scheduler/resource-timeline`        | `resourceTimelineDay`/`Week`/`Month`/`Year` views        |
| `fullcalendar-scheduler/resource-timegrid`        | `resourceTimeGridDay`/`Week` views                       |
| `fullcalendar-scheduler/resource-daygrid`         | `resourceDayGridDay`/`Week`/`Month` views                |
| `fullcalendar-scheduler/timeline`                 | `timelineDay`/`Week`/`Month`/`Year` views (no resources) |
| `fullcalendar-scheduler/scrollgrid`               | enhanced scroll-related features for large grids         |
| `fullcalendar-scheduler/adaptive`                 | print-optimized rendering                                |

## Links

- [Documentation](https://fullcalendar.io/docs/getting-started)
- [Scheduler Documentation](https://fullcalendar.io/docs/premium)
- [Options Reference](https://fullcalendar.io/docs#toc)
