
# FullCalendar React Scheduler

FullCalendar React Scheduler package, for rendering resource views

## Installation

```sh
npm install @fullcalendar/react @fullcalendar/react-scheduler temporal-polyfill
```

## Usage

Render a `FullCalendar` component with [options](https://fullcalendar.io/docs#toc), including one or more scheduler plugins:

```jsx
import FullCalendar from '@fullcalendar/react'
import classicThemePlugin from '@fullcalendar/react/themes/classic'
import interactionPlugin from '@fullcalendar/react/interaction'
import resourceTimelinePlugin from '@fullcalendar/react-scheduler/resource-timeline'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/classic/theme.css'
import '@fullcalendar/react/themes/classic/palette.css'

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

| Import                                            | Provides                                                 |
| ------------------------------------------------- | -------------------------------------------------------- |
| `@fullcalendar/react-scheduler/resource-timeline` | `resourceTimelineDay`/`Week`/`Month`/`Year` views        |
| `@fullcalendar/react-scheduler/resource-timegrid` | `resourceTimeGridDay`/`Week` views                       |
| `@fullcalendar/react-scheduler/resource-daygrid`  | `resourceDayGridDay`/`Week`/`Month` views                |
| `@fullcalendar/react-scheduler/timeline`          | `timelineDay`/`Week`/`Month`/`Year` views (no resources) |
| `@fullcalendar/react-scheduler/scrollgrid`        | enhanced scroll-related features for large grids         |
| `@fullcalendar/react-scheduler/adaptive`          | print-optimized rendering                                |

## Links

- [React Documentation](https://fullcalendar.io/docs/react)
- [React Scheduler Documentation](https://fullcalendar.io/docs/react#fullcalendar-premium)
- [React Scheduler Example Project](https://github.com/fullcalendar/fullcalendar-examples/tree/main/react19-scheduler)
- [Options Reference](https://fullcalendar.io/docs#toc)
