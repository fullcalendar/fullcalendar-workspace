import { CalendarOptions } from '@fullcalendar/core'

export interface SchedulerProps extends Omit<CalendarOptions, 'class'> {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

