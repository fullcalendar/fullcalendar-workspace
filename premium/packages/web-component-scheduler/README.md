
# FullCalendar Web Component Scheduler

FullCalendar [Web Component](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) Scheduler package, for rendering resource views

## Installation

```sh
npm install @fullcalendar/web-component @fullcalendar/web-component-scheduler temporal-polyfill
```

## Usage

Render a `FullCalendar` component with [options](https://fullcalendar.io/docs#toc), including one or more scheduler plugins:

```js
// globally installs the <full-calendar> tag
import '@fullcalendar/web-component/global'

// plugins
import themePlugin from '@fullcalendar/web-component/themes/monarch' // YOUR THEME
import interactionPlugin from '@fullcalendar/web-component/interaction'
import resourceTimelinePlugin from '@fullcalendar/web-component-scheduler/resource-timeline'

// stylesheets
import '@fullcalendar/web-component/skeleton.styles' // ALWAYS NEED SKELETON
import '@fullcalendar/web-component/themes/monarch/theme.styles' // YOUR THEME
import '@fullcalendar/web-component/themes/monarch/palettes/purple.css' // YOUR THEME'S PALETTE

// initialize with options and plugins
const fullCalendarElement = document.querySelector('full-calendar')
fullCalendarElement.options = {
  plugins: [themePlugin, interactionPlugin, resourceTimelinePlugin],
  initialView: 'resourceTimelineWeek',
  schedulerLicenseKey: 'YOUR-LICENSE-KEY',
  editable: true,
  events: [
    { id: '1', resourceId: 'a', title: 'Meeting', start: new Date() },
  ],
  resources: [
    { id: 'a', title: 'Resource A' },
    { id: 'b', title: 'Resource B' },
  ]
}
```

Please note, `skeleton.styles` and `theme.styles` are JS, and yes they do inject CSS. This is required for the web component’s shadow DOM.

Then, in your HTML:

```html
<full-calendar></full-calendar>
```

## Plugins

| Import                                                    | Provides                                                 |
| --------------------------------------------------------- | -------------------------------------------------------- |
| `@fullcalendar/web-component-scheduler/resource-timeline` | `resourceTimelineDay`/`Week`/`Month`/`Year` views        |
| `@fullcalendar/web-component-scheduler/resource-timegrid` | `resourceTimeGridDay`/`Week` views                       |
| `@fullcalendar/web-component-scheduler/resource-daygrid`  | `resourceDayGridDay`/`Week`/`Month` views                |
| `@fullcalendar/web-component-scheduler/timeline`          | `timelineDay`/`Week`/`Month`/`Year` views (no resources) |
| `@fullcalendar/web-component-scheduler/scrollgrid`        | enhanced scroll-related features for large grids         |
| `@fullcalendar/web-component-scheduler/adaptive`          | print-optimized rendering                                |

## Links

- [Web Component Documentation](https://fullcalendar.io/docs/web-component)
- [Web Component Scheduler Documentation](https://fullcalendar.io/docs/web-component#fullcalendar-premium)
- [Options Reference](https://fullcalendar.io/docs#toc)
