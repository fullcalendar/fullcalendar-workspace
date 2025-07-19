import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

export const schedulerOnlyIconOptions: CalendarOptions = {
  // TODO: better size
  resourceExpanderContent: (data) => (
    data.isExpanded
      ? <ExpandMoreIcon />
      : data.direction === 'rtl'
        ? <ChevronLeftIcon />
        : <ChevronRightIcon />
  )
}
