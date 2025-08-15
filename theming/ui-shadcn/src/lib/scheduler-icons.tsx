import React from 'react'
import { CalendarOptions, joinClassNames } from "@fullcalendar/core"
import { ChevronDownIcon } from 'lucide-react'

export const schedulerOnlyIconOptions: CalendarOptions = {
  resourceExpanderContent: (data) => (
    <ChevronDownIcon
      className={joinClassNames(
        'size-4',
        data.isExpanded &&
          (data.direction === 'rtl' ? 'rotate-90' : '-rotate-90')
      )}
    />
  )
}
