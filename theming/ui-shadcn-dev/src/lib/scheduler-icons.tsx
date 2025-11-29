import React from 'react'
import { CalendarOptions, joinClassNames } from "@fullcalendar/core"
import { mutedFgPressableGroupClass } from './option-params.js'
import { ChevronDownIcon } from 'lucide-react'

export const schedulerOnlyIconOptions: CalendarOptions = {

  /* Resource Data Grid
  ----------------------------------------------------------------------------------------------- */

  resourceExpanderContent: (data) => (
    <ChevronDownIcon
      className={joinClassNames(
        `size-4 m-px ${mutedFgPressableGroupClass}`,
        !data.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90'
      )}
    />
  )
}
