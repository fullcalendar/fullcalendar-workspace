import { createFormatter, RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/core/internal'

export const OPTION_REFINERS = {
  dayHeaders: Boolean,
  dayHeaderFormat: createFormatter,
}

type DayGridOptionRefiners = typeof OPTION_REFINERS
export type DayGridOptions = RawOptionsFromRefiners<DayGridOptionRefiners>
export type DayGridOptionsRefined = RefinedOptionsFromRefiners<DayGridOptionRefiners>

export const OPTION_DEFAULTS = {
  dayHeaders: true,
}
