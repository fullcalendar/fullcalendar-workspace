import { Calendar, isValuesSimilar } from '@fullcalendar/core'

export default {
  resources: handleResources
}

function handleResources(newSourceInput, calendar: Calendar) {
  let oldSourceInput = calendar.state.resourceSource._raw

  if (!isValuesSimilar(oldSourceInput, newSourceInput, 2)) {
    calendar.dispatch({
      type: 'RESET_RESOURCE_SOURCE',
      resourceSourceInput: newSourceInput
    })
  }
}
