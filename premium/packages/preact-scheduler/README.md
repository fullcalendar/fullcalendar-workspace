
# FullCalendar Preact Scheduler

FullCalendar Preact Scheduler package, for rendering resource views

## Installation

```sh
npm install @fullcalendar/preact @fullcalendar/preact-scheduler temporal-polyfill
```

## Usage

Render a `FullCalendar` component with [options](https://fullcalendar.io/docs#toc), including one or more scheduler plugins:

```jsx
import FullCalendar from '@fullcalendar/preact'
import classicThemePlugin from '@fullcalendar/preact/themes/classic'
import interactionPlugin from '@fullcalendar/preact/interaction'
import resourceTimelinePlugin from '@fullcalendar/preact-scheduler/resource-timeline'

import '@fullcalendar/preact/skeleton.css'
import '@fullcalendar/preact/themes/classic/theme.css'
import '@fullcalendar/preact/themes/classic/palette.css'

<FullCalendar
  plugins={[
    classicThemePlugin,
    interactionPlugin,
    resourceTimelinePlugin,
  ]}
  initialView='resourceTimelineWeek'
  schedulerLicenseKey='YOUR-LICENSE-KEY'
  editable={true}
  events={[
    { id: '1', resourceId: 'a', title: 'Meeting', start: new Date() },
  ]}
  resources={[
    { id: 'a', title: 'Resource A' },
    { id: 'b', title: 'Resource B' },
  ]}
/>
```

## Plugins

| Import                                             | Provides                                                 |
| -------------------------------------------------- | -------------------------------------------------------- |
| `@fullcalendar/preact-scheduler/resource-timeline` | `resourceTimelineDay`/`Week`/`Month`/`Year` views        |
| `@fullcalendar/preact-scheduler/resource-timegrid` | `resourceTimeGridDay`/`Week` views                       |
| `@fullcalendar/preact-scheduler/resource-daygrid`  | `resourceDayGridDay`/`Week`/`Month` views                |
| `@fullcalendar/preact-scheduler/timeline`          | `timelineDay`/`Week`/`Month`/`Year` views (no resources) |
| `@fullcalendar/preact-scheduler/scrollgrid`        | enhanced scroll-related features for large grids         |
| `@fullcalendar/preact-scheduler/adaptive`          | print-optimized rendering                                |

## Links

- [Preact Documentation](https://fullcalendar.io/docs/preact)
- [Preact Scheduler Documentation](https://fullcalendar.io/docs/preact#fullcalendar-premium)
- [Preact Scheduler Example Project](https://github.com/fullcalendar/fullcalendar-examples/tree/main/preact-scheduler)
- [Options Reference](https://fullcalendar.io/docs#toc)
