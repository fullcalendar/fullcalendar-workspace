
# FullCalendar MUI Integration

Display an event calendar that inherits from your [@mui/material](https://www.npmjs.com/package/@mui/material) theme.

## Installation

```sh
npm install @fullcalendar/react @fullcalendar/mui
```

## Usage

First, choose a theme "flavor": `monarch`, `forma`, `breezy`, `pulse`, or `classic`.

Next, decide whether you're using FullCalendar "standard" (aka "EventCalendar") or [premium](https://fullcalendar.io/pricing) (aka "Scheduler").

### Standard Usage

```jsx
import EventCalendar from '@fullcalendar/mui/monarch/EventCalendar'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/mui/monarch/theme.css'

<EventCalendar
  addButton={{
    text: 'Add Event',
    click() {
      alert('add event...')
    }
  }}
/>
```

### Premium Usage

You must install an additional package:

```sh
npm install @fullcalendar/react-scheduler
```

Then write your component code:

```jsx
import ResourceTimeline from '@fullcalendar/mui/monarch/ResourceTimeline'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/mui/monarch/theme.css'

<ResourceTimeline
  addButton={{
    text: 'Add Resource',
    click() {
      alert('add resource...')
    }
  }}
/>
```

A `ResourceTimeGrid` component is also available for resource-based time-grid views.

### Custom Usage

Want complete control over the toolbar, calendar views, or plugins? Future docs will explain how to do this.
