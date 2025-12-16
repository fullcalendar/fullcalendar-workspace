import { CalendarOptions } from '@fullcalendar/core'

export interface EventCalendarProps extends Omit<CalendarOptions, 'class'> {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}
