import { Calendar } from '@fullcalendar/core'

export default {
  resources: handleResources
}

function handleResources(resourcesInput, calendar: Calendar) {
  console.log('resources', resourcesInput, calendar)
}
