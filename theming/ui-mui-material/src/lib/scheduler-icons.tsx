import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

export const schedulerOnlyIconOptions: CalendarOptions = {
  resourceExpanderContent: (data) => (
    <ExpandMoreIcon
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
