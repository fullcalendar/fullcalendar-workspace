import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { XIcon } from 'lucide-react'

export const eventCalendarIconOptions: CalendarOptions = {
  popoverCloseContent: () => <XIcon /> // TODO: do custom size
}
