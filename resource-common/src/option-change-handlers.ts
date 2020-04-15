import { Calendar } from '@fullcalendar/core'

export const optionChangeHandlers = {
  resources: handleResources
}

function handleResources(newSourceInput, calendar: Calendar) {
  let oldSourceInput = calendar.state.resourceSource._raw

  if (oldSourceInput !== newSourceInput) {
    calendar.dispatch({
      type: 'RESET_RESOURCE_SOURCE',
      resourceSourceInput: newSourceInput
    })
  }
}
