import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import CloseIcon from '@mui/icons-material/Close'

export const eventCalendarIconOptions: CalendarOptions = {
  popoverCloseContent: () => <CloseIcon /> // TODO: do custom size
}
