import React from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { CalendarOptions, joinClassNames } from "@fullcalendar/react"
import { mutedFgPressableGroupClass } from './option-params'

import type {} from '@fullcalendar/react-scheduler/resource-timeline'

export const schedulerOnlyIconOptions: CalendarOptions = {

  /* Resource Data Grid
  ----------------------------------------------------------------------------------------------- */

  resourceExpanderContent: (info) => (
    <ChevronDownIcon
      className={joinClassNames(
        `size-4 m-px ${mutedFgPressableGroupClass}`,
        !info.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90'
      )}
    />
  )
}
