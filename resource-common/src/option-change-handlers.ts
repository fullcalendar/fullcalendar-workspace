import { Calendar } from '@fullcalendar/core'

export default {
  resources: handleResources
}

function handleResources(newSourceInput, calendar: Calendar, deepEqual) {
  let oldSourceInput = calendar.state.resourceSource._raw

  if (!deepEqual(oldSourceInput, newSourceInput)) {
    calendar.dispatch({
      type: 'RESET_RESOURCE_SOURCE',
      resourceSourceInput: newSourceInput
    })
  }
}
