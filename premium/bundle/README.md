
# FullCalendar Premium Bundle

Easily render a full-sized drag & drop calendar with a combination of standard & [premium](https://fullcalendar.io/docs/premium) plugins

This `fullcalendar-scheduler` package bundles these plugins:

- [@fullcalendar/core](https://github.com/fullcalendar/fullcalendar/tree/main/packages/core)
- [@fullcalendar/interaction](https://github.com/fullcalendar/fullcalendar/tree/main/packages/interaction)
- [@fullcalendar/daygrid](https://github.com/fullcalendar/fullcalendar/tree/main/packages/daygrid)
- [@fullcalendar/timegrid](https://github.com/fullcalendar/fullcalendar/tree/main/packages/timegrid)
- [@fullcalendar/list](https://github.com/fullcalendar/fullcalendar/tree/main/packages/list)
- [@fullcalendar/multimonth](https://github.com/fullcalendar/fullcalendar/tree/main/packages/multimonth)
- [@fullcalendar/adaptive](https://github.com/fullcalendar/fullcalendar-workspace/tree/main/packages/adaptive)
- [@fullcalendar/timeline](https://github.com/fullcalendar/fullcalendar-workspace/tree/main/packages/timeline)
- [@fullcalendar/resource](https://github.com/fullcalendar/fullcalendar-workspace/tree/main/packages/resource)
- [@fullcalendar/resource-daygrid](https://github.com/fullcalendar/fullcalendar-workspace/tree/main/packages/resource-daygrid)
- [@fullcalendar/resource-timegrid](https://github.com/fullcalendar/fullcalendar-workspace/tree/main/packages/resource-timegrid)
- [@fullcalendar/resource-timeline](https://github.com/fullcalendar/fullcalendar-workspace/tree/main/packages/resource-timeline)

## Usage with CDN or ZIP archive

Load the `index.global.min.js` file and use the `FullCalendar` global namespace:

```html
<!DOCTYPE html>
<html>
  <head>
    <script src='https://cdn.jsdelivr.net/npm/fullcalendar-scheduler/index.global.min.js'></script>
    <script>

      document.addEventListener('DOMContentLoaded', function() {
        const calendarEl = document.getElementById('calendar')
        const calendar = new FullCalendar.Calendar(calendarEl, {
          initialView: 'resourceTimelineMonth'
        })
        calendar.render()
      })

    </script>
  </head>
  <body>
    <div id='calendar'></div>
  </body>
</html>
```

## Usage with NPM and ES modules

```sh
npm install fullcalendar-scheduler
```

```js
import { Calendar } from 'fullcalendar-scheduler'

document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar')
  const calendar = new Calendar(calendarEl, {
    initialView: 'resourceTimelineMonth'
  })
  calendar.render()
})
```
