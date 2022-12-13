
# FullCalendar Resource Plugin

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
