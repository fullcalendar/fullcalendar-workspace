import React from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { CalendarOptions, joinClassNames } from "@fullcalendar/core"
import { pressableIconClass } from './params.js'

export const schedulerOnlyIconOptions: CalendarOptions = {
  resourceExpanderContent: (data) => (
    <ExpandMoreIcon
      // the "small" fontSize rasterizes the SVG strangely, so workaround
      sx={{ fontSize: 18, margin: '1px' }}
      className={joinClassNames(
        pressableIconClass,
        !data.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90'
      )}
    />
  )
}
