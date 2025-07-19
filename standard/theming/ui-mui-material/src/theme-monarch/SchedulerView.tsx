import React from 'react'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { CalendarOptions } from '@fullcalendar/core'
import { createSchedulerOnlyOptions } from '@fullcalendar/theme-monarch/options-scheduler'
import { optionParams, EventCalendarView } from './EventCalendarView.js'

const baseSchedulerOnlyOptions = createSchedulerOnlyOptions(optionParams)

export function SchedulerView(options: CalendarOptions) {
  return (
    <EventCalendarView
      {...baseSchedulerOnlyOptions.optionDefaults}

      // TODO: better size
      resourceExpanderContent={(data) => (
        data.isExpanded
          ? <ExpandMoreIcon />
          : data.direction === 'rtl'
            ? <ChevronLeftIcon />
            : <ChevronRightIcon />
      )}

      {...options}

      views={{
        ...baseSchedulerOnlyOptions.views,
        ...options.views,
      }}
    />
  )
}
