import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface EventCalendarContainerProps {
  direction: 'ltr' | 'rtl' | undefined
  className: string | undefined
  height: string | number | undefined
  borderless: boolean | undefined
  borderlessX: boolean | undefined
  borderlessTop: boolean | undefined
  borderlessBottom: boolean | undefined
  children: ReactNode
}

export function EventCalendarContainer(props: EventCalendarContainerProps) {
  const borderlessX = props.borderlessX ?? props.borderless
  const borderlessTop = props.borderlessTop ?? props.borderless
  const borderlessBottom = props.borderlessBottom ?? props.borderless

  return (
    <div
      dir={props.direction === 'rtl' ? 'rtl' : undefined}
      className={cn(
        'flex flex-col bg-background',
        !borderlessX && !borderlessTop && !borderlessBottom && 'rounded-lg overflow-hidden',
        !borderlessX && 'border-x',
        !borderlessTop && 'border-t',
        !borderlessBottom && 'border-b',
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
