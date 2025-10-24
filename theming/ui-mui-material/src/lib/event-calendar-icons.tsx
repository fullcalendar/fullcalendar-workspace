import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import CloseIcon from '@mui/icons-material/Close'

export const eventCalendarIconOptions: CalendarOptions = {
  popoverCloseContent: () => (
    <CloseIcon
      // the "small" fontSize rasterizes the SVG strangely, so workaround
      sx={{ fontSize: 18, margin: '1px' }}
      // NOTE: changing text-color is complicated, and I don't think MUI usually does this anyway
    />
  )
}
