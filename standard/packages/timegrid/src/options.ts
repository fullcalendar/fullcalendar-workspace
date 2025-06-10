import { ClassNamesInput } from '@fullcalendar/core'
import { Identity, identity, RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/core/internal'

export const OPTION_REFINERS = {
  allDaySlot: Boolean,
  allDayDividerClass: identity as Identity<ClassNamesInput>,
}

type TimeGridOptionRefiners = typeof OPTION_REFINERS
export type TimeGridOptions = RawOptionsFromRefiners<TimeGridOptionRefiners>
export type TimeGridOptionsRefined = RefinedOptionsFromRefiners<TimeGridOptionRefiners>
