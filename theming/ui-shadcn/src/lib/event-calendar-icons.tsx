import React from 'react'
import { CalendarOptions } from "@fullcalendar/react"
import { mutedFgPressableGroupClass } from './option-params'
import { XIcon } from 'lucide-react'

export const eventCalendarIconOptions: CalendarOptions = {
  popoverCloseContent: () => (
    <XIcon className={`size-5 ${mutedFgPressableGroupClass}`} />
  )
}
