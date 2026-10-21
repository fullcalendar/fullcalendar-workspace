import { DateMarker, DateRange, Duration } from '@full-ui/headless-calendar'
import { Dictionary } from '../options'

export interface DayCol {
  key: string
  date: DateMarker
  range: DateRange
  isMajor: boolean
  isDisabled: boolean
  isInert?: boolean // structural columns that cannot be interaction targets
  renderProps?: Dictionary
  attrs?: Dictionary
  className?: string
  dateSpanProps?: Dictionary
}

export interface DayColSlotRange {
  slotMinTime: Duration
  slotMaxTime: Duration
}
