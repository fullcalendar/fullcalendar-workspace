import { defineView } from 'fullcalendar'
import ResourceBasicView from './ResourceBasicView'

defineView('resourceMonth', {
  class: ResourceBasicView,
  monthMode: true,
  duration: { months: 1 }, // important for prev/next
  fixedWeekCount: true
})

defineView('resourceBasicWeek', {
  class: ResourceBasicView,
  duration: { weeks: 1 },
})
