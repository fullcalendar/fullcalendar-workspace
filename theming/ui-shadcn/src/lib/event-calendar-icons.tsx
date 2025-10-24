import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { XIcon } from 'lucide-react'

export const eventCalendarIconOptions: CalendarOptions = {
  popoverCloseContent: () => (
    <XIcon className='size-5 text-muted-foreground group-hover:text-foreground group-focus-visible:text-foreground' />
  )
}
