import React, { ReactNode } from 'react'
import { cn } from '../../lib/utils.js'

export interface EventCalendarContainerProps {
  direction: 'ltr' | 'rtl' | undefined
  className: string | undefined
  height: string | number | undefined
  children: ReactNode
}

export function EventCalendarContainer(props: EventCalendarContainerProps) {
  return (
    <div
      dir={props.direction === 'rtl' ? 'rtl' : undefined}
      className={cn(
        'flex flex-col gap-5',
        props.className,
      )}
      style={{
        height: props.height
      }}
    >
      {props.children}
    </div>
  )
}
