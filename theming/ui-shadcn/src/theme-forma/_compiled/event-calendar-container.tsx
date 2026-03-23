import React, { type ReactNode } from 'react'
import { cn } from '../../lib/utils.js'

export interface EventCalendarContainerProps {
  direction: 'ltr' | 'rtl' | undefined
  className: string | undefined
  height: string | number | undefined
  autoHeight: boolean
  borderless: boolean | undefined
  borderlessX: boolean | undefined
  borderlessTop: boolean | undefined
  borderlessBottom: boolean | undefined
  children: ReactNode
}

export function EventCalendarContainer(props: EventCalendarContainerProps) {
  const hasBorderX = !(props.borderlessX ?? props.borderless)
  const hasBorderTop = !(props.borderlessTop ?? props.borderless)
  const hasBorderBottom = !(props.borderlessBottom ?? props.borderless)

  return (
    <div
      dir={props.direction === 'rtl' ? 'rtl' : undefined}
      className={cn(
        'flex flex-col bg-background',
        hasBorderX && 'border-x',
        hasBorderTop && 'border-t',
        hasBorderBottom && 'border-b',
        (hasBorderTop && hasBorderX) && 'rounded-t-sm',
        (hasBorderBottom && hasBorderX) && 'rounded-b-sm',
        (hasBorderTop && hasBorderX && hasBorderBottom) && 'shadow-xs',
        !props.autoHeight && 'overflow-hidden',
        props.className,
      )}
      style={{
        height: props.height,
      }}
    >
      {props.children}
    </div>
  )
}
