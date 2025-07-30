import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { ChevronDownIcon } from 'lucide-react'

export const schedulerOnlyIconOptions: CalendarOptions = {
  resourceExpanderContent: (data) => (
    <ChevronDownIcon
      className={
        data.isExpanded
          ? ''
          : '-rotate-90 [dir=rtl]:rotate-90'
          // TODO: test rtl
          // TODO: animate rotation
      }
    />
  )
}
