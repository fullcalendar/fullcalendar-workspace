
# FullCalendar Premium

Premium full-sized drag & drop calendar & scheduler in JavaScript

- [Project Website](https://fullcalendar.io/pricing)
- [Documentation](https://fullcalendar.io/docs/premium)
- [Support](https://fullcalendar.io/support)
- [License](LICENSE.md)
- [Roadmap](https://fullcalendar.io/roadmap)

## Bundle

The [FullCalendar Premium Bundle](bundle) is easier to install than individual plugins, though filesize will be larger. It works well with a CDN.

## Installation

Install the FullCalendar vanilla-JS and scheduler packages:

```sh
npm install @fullcalendar/vanilla @fullcalendar/vanilla-scheduler
```

## Usage

Instantiate a Calendar with plugins and options:

```js
import { Calendar } from '@fullcalendar/vanilla'
import classicThemePlugin from '@fullcalendar/vanilla/themes/classic'
import interactionPlugin from '@fullcalendar/vanilla/interaction'
import resourceTimelinePlugin from '@fullcalendar/vanilla-scheduler/resource-timeline'

import '@fullcalendar/vanilla/skeleton.css'
import '@fullcalendar/vanilla/themes/classic/theme.css'
import '@fullcalendar/vanilla/themes/classic/palette.css'

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [
    classicThemePlugin,
    interactionPlugin,
    resourceTimelinePlugin
  ],
  initialView: 'resourceTimelineWeek',
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
