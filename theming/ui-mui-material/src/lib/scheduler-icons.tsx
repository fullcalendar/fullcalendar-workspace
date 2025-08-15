import React from 'react'
import { CalendarOptions, joinClassNames } from "@fullcalendar/core"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

export const schedulerOnlyIconOptions: CalendarOptions = {
  resourceExpanderContent: (data) => (
    <ExpandMoreIcon
      className={joinClassNames(
        data.isExpanded &&
          (data.direction === 'rtl' ? 'rotate-90' : '-rotate-90')
      )}
    />
  )
}
