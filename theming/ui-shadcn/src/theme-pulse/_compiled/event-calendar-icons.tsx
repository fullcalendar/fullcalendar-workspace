import React from 'react'
import { ChevronDownIcon, XIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from '../../lib/utils.js'

export function EventCalendarPrevIcon() {
  return (
    <ChevronLeftIcon className='[[dir=rtl]_&]:rotate-180' />
  )
}

export function EventCalendarNextIcon() {
  return (
    <ChevronRightIcon className='[[dir=rtl]_&]:rotate-180' />
  )
}

const hoverIconClassName = 'text-muted-foreground group-hover:text-foreground group-focus-visible:text-foreground'

export function EventCalendarCloseIcon() {
  return (
    <XIcon className={`size-5 ${hoverIconClassName}`} />
  )
}

export function EventCalendarExpanderIcon(props: { isExpanded: boolean }) {
  return (
    <ChevronDownIcon
      className={cn(
        `size-4 m-px ${hoverIconClassName}`,
        !props.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90'
      )}
    />
  )
}
