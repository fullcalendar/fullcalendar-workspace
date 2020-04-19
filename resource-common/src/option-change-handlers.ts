import { ReducerContext } from '@fullcalendar/core'

export const optionChangeHandlers = {
  resources: handleResources
}

function handleResources(newSourceInput, context: ReducerContext) {
  let oldSourceInput = context.getCurrentState().resourceSource._raw

  if (oldSourceInput !== newSourceInput) {
    context.dispatch({
      type: 'RESET_RESOURCE_SOURCE',
      resourceSourceInput: newSourceInput
    })
  }
}
