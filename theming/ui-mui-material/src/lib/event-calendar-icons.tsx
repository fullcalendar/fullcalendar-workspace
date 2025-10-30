import React from 'react'
import CloseIcon from '@mui/icons-material/Close'
import { CalendarOptions } from "@fullcalendar/core"
import { pressableIconClass } from './option-params.js'

export const eventCalendarIconOptions: CalendarOptions = {
  popoverCloseContent: () => (
    <CloseIcon
      // the "small" fontSize rasterizes the SVG strangely, so workaround
      sx={{ fontSize: 18, margin: '1px' }}
      className={pressableIconClass}
    />
  )
}
