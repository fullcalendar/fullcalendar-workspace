
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

You must install additional packages:

```sh
npm install \
  @fullcalendar/adaptive \
  @fullcalendar/scrollgrid \
  @fullcalendar/timeline \
  @fullcalendar/resource-timeline \
  @fullcalendar/resource-timegrid \
  @fullcalendar/resource-daygrid
```

Then write your component code:

```jsx
import Scheduler from '@fullcalendar/mui/monarch/Scheduler'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/mui/monarch/theme.css'

<EventCalendar
  addButton={{
    text: 'Add Resource',
    click() {
      alert('add resource...')
    }
  }}
/>
```

### Custom Usage

Want complete control over the toolbar, calendar views, or plugins? Future docs will explain how to do this.
