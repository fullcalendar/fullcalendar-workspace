import { DateMarker, DateRange } from '@full-ui/headless-calendar'

// the days of the week a view hides (hiddenDays, weekends), as a value. see DateProfileGenerator.hiddenDays
export interface HiddenDays {
  isHidden(dayOrDate: number | DateMarker): boolean // a day-of-week index, or a marker (its UTC day)
  // the first day from `date` (inclusive) that's shown, stepping by `inc`. `isExclusive` for an end date
  skip(date: DateMarker, inc?: number, isExclusive?: boolean): DateMarker
  // the range without hidden days at its ends. null if it's all hidden
  trim(range: DateRange): DateRange | null
}
