import { CalendarContext } from '@fullcalendar/common'

export const optionChangeHandlers = {
  resources: handleResources,
}

function handleResources(newSourceInput, context: CalendarContext) {
  let oldSourceInput = context.getCurrentData().resourceSource._raw

  if (oldSourceInput !== newSourceInput) {
    context.dispatch({
      type: 'RESET_RESOURCE_SOURCE',
      resourceSourceInput: newSourceInput,
    })
  }
}
