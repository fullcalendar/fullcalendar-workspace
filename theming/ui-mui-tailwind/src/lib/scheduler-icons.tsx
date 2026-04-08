import React from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { CalendarOptions, joinClassNames } from "@fullcalendar/react"
import { pressableIconClass } from './option-params'

import type {} from '@fullcalendar/react-scheduler/resource-timeline'

export const schedulerOnlyIconOptions: CalendarOptions = {
  resourceExpanderContent: (info) => (
    <ExpandMoreIcon
      // the "small" fontSize rasterizes the SVG strangely, so workaround
      sx={{ fontSize: 18, margin: '1px' }}
      className={joinClassNames(
        pressableIconClass,
        !info.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90'
      )}
    />
  )
}
