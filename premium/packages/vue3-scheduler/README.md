
# FullCalendar Vue 3 Scheduler

FullCalendar Vue Scheduler package, for rendering resource views

## Installation

```sh
npm install @fullcalendar/vue3 @fullcalendar/vue3-scheduler temporal-polyfill
```

## Coming from v6?

In v7, the premium plugins are part of this package, imported from subpaths like `@fullcalendar/vue3-scheduler/resource-timeline`, and the standard plugins come from `@fullcalendar/vue3` (e.g. `@fullcalendar/vue3/daygrid`). The separate `@fullcalendar/resource`, `@fullcalendar/resource-timeline`, `@fullcalendar/timeline`, `@fullcalendar/core`, `@fullcalendar/daygrid` (etc.) packages are FullCalendar v6. Don't install them with v7, and don't downgrade to v6: uninstall them and import plugins from `@fullcalendar/vue3-scheduler/resource-timeline` and `@fullcalendar/vue3/daygrid`. See the [upgrade guide](https://fullcalendar.io/docs/upgrading-from-v6).

## Usage

Render a `FullCalendar` component with [options](https://fullcalendar.io/docs#toc), including one or more scheduler plugins:

```vue
<script>
import FullCalendar from '@fullcalendar/vue3'
import classicThemePlugin from '@fullcalendar/vue3/themes/classic'
import interactionPlugin from '@fullcalendar/vue3/interaction'
import resourceTimelinePlugin from '@fullcalendar/vue3-scheduler/resource-timeline'

import '@fullcalendar/vue3/skeleton.css'
import '@fullcalendar/vue3/themes/classic/theme.css'
import '@fullcalendar/vue3/themes/classic/palette.css'

export default {
  components: {
    FullCalendar // make the <FullCalendar> tag available
  },
  data: function() {
    return {
      calendarOptions: {
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
      }
    }
  }
}
</script>

<template>
  <h1>Demo App</h1>
  <FullCalendar :options='calendarOptions' />
</template>
```

## Plugins

| Import                                           | Provides                                                 |
| ------------------------------------------------ | -------------------------------------------------------- |
| `@fullcalendar/vue3-scheduler/resource-timeline` | `resourceTimelineDay`/`Week`/`Month`/`Year` views        |
| `@fullcalendar/vue3-scheduler/resource-timegrid` | `resourceTimeGridDay`/`Week` views                       |
| `@fullcalendar/vue3-scheduler/resource-daygrid`  | `resourceDayGridDay`/`Week`/`Month` views                |
| `@fullcalendar/vue3-scheduler/timeline`          | `timelineDay`/`Week`/`Month`/`Year` views (no resources) |
| `@fullcalendar/vue3-scheduler/scrollgrid`        | enhanced scroll-related features for large grids         |
| `@fullcalendar/vue3-scheduler/adaptive`          | print-optimized rendering                                |

## Links

- [Vue Documentation](https://fullcalendar.io/docs/vue)
- [Vue Scheduler Documentation](https://fullcalendar.io/docs/vue#fullcalendar-premium)
- [Vue Scheduler Example Project](https://github.com/fullcalendar/fullcalendar-examples/tree/main/vue3-scheduler)
- [Options Reference](https://fullcalendar.io/docs/all)
