import { useCallback, useState } from 'react'
import { CalendarController } from './CalendarController'

/*
A CalendarController for a component that renders a calendar beside its own toolbar: the same
controller across renders, and a re-render of the component whenever the calendar's dates change
*/
export function useCalendarController(): CalendarController {
  const handleDateChange = useCallback(() => {
    // controllerWrap.controller will ALWAYS contain the first and only CalendarController
    setControllerWrap({ controller: controllerWrap.controller })
  }, [])

  // wrap controller in unique object to ensure new references and rerender
  const [controllerWrap, setControllerWrap] = useState(() => ({
    controller: new CalendarController(handleDateChange)
  }))

  // TODO: destroy by ._setApi(undefined) ?

  return controllerWrap.controller
}
