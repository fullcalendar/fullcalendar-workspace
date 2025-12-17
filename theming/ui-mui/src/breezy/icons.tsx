import React from 'react'
import { joinClassNames } from '@fullcalendar/core'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const pressableIconClass = 'text-(--mui-palette-action-active) group-hover:text-(--mui-palette-text-primary) group-focus-visible:text-(--mui-palette-text-primary)'

export function EventCalendarPrevIcon() {
  return <ChevronLeftIcon className='[[dir=rtl]_&]:rotate-180' />
}

export function EventCalendarNextIcon() {
  return <ChevronRightIcon className='[[dir=rtl]_&]:rotate-180' />
}

export function EventCalendarCloseIcon() {
  return (
    <CloseIcon
      sx={{ fontSize: 18, margin: '1px' }}
      className={pressableIconClass}
    />
  )
}

export interface EventCalendarExpanderIconProps {
  isExpanded: boolean
}

export function EventCalendarExpanderIcon({ isExpanded }: EventCalendarExpanderIconProps) {
  return (
    <ExpandMoreIcon
      sx={{ fontSize: 18, margin: '1px' }}
      className={joinClassNames(
        pressableIconClass,
        !isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90'
      )}
    />
  )
}

