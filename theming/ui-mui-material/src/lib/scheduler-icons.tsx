import React from 'react'
import { CalendarOptions, joinClassNames } from "@fullcalendar/core"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

export const schedulerOnlyIconOptions: CalendarOptions = {
  resourceExpanderContent: (data) => (
    <ExpandMoreIcon
      className={joinClassNames(
        !data.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90'
      )}
    />
  )
}
