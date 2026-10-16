
# FullCalendar Resource Plugin

> **This package is for FullCalendar v6.** The current version is v7, where `@fullcalendar/resource` is no longer a separate package. With v7, don't install `@fullcalendar/resource` or `@fullcalendar/core`, and don't downgrade to v6: its functionality is built into each framework's v7 scheduler package, e.g. `@fullcalendar/react-scheduler`, whose view plugins load it for you (`import resourceTimelinePlugin from '@fullcalendar/react-scheduler/resource-timeline'`). See the [upgrade guide](https://fullcalendar.io/docs/upgrading-from-v6).

Base support for resources, required by resource views

## Installation

It is necessary to install this package as a [peer dependency](https://nodejs.org/es/blog/npm/peer-dependencies/) of any other package that utilizes resources (such as [resource-timeline view](https://fullcalendar.io/docs/timeline-view)):

```sh
npm install @fullcalendar/core @fullcalendar/resource @fullcalendar/resource-timeline
```

## Usage

This package is especially useful for obtaining the `ResourceInput` TypeScript type:

```ts
import { Calendar } from '@fullcalendar/core'
import { ResourceInput } from '@fullcalendar/resource'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'

const resources: ResourceInput[] = [
  { title: 'Resource A' },
  { title: 'Resource B' }
]

const calendarEl = document.getElementById('calendar')
const calendar = new Calendar(calendarEl, {
  plugins: [ resourceTimelinePlugin ],
  initialView: 'resourceTimeline',
  resources: resources
})

calendar.render()
```
