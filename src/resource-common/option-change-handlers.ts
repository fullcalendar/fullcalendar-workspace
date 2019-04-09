import { Calendar, isValuesSimilar } from '@fullcalendar/core'

export default {
  resources: handleResources
}

function handleResources(newSourceInput, calendar: Calendar) {
  const oldSourceInput = calendar.state.resourceSource

  if (!oldSourceInput || !isValuesSimilar(oldSourceInput._raw, newSourceInput, 2)) {
    calendar.dispatch({
      type: 'RESET_RESOURCE_SOURCE',
      resourceSourceInput: newSourceInput
    })
  }
}
