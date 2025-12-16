import React, { ReactNode } from 'react'
import { cn } from '../../lib/utils.js'

export interface EventCalendarContainerProps {
  direction: 'ltr' | 'rtl' | undefined
  className: string | undefined
  height: string | number | undefined
  borderlessX: boolean | undefined
  borderlessTop: boolean | undefined
  borderlessBottom: boolean | undefined
  children: ReactNode
}

export function EventCalendarContainer(props: EventCalendarContainerProps) {
  return (
    <div
      dir={props.direction === 'rtl' ? 'rtl' : undefined}
      className={cn(
        'flex flex-col bg-background',
        !props.borderlessX && !props.borderlessTop && !props.borderlessBottom && 'rounded-lg overflow-hidden',
        !props.borderlessX && 'border-x',
        !props.borderlessTop && 'border-t',
        !props.borderlessBottom && 'border-b',
      )}
      style={{
        height: props.height,
      }}
    >
      {props.children}
    </div>
  )
}
