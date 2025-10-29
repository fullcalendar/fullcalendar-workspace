import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { mutedFgPressableGroupClass } from './params.js'
import { XIcon } from 'lucide-react'

export const eventCalendarIconOptions: CalendarOptions = {
  popoverCloseContent: () => (
    <XIcon className={`size-5 ${mutedFgPressableGroupClass}`} />
  )
}
