import { ClassNameInput } from '@fullcalendar/core'
import { Identity, identity, RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/core/internal'

export const OPTION_REFINERS = {
  allDayDividerClass: identity as Identity<ClassNameInput>,
}

type TimeGridOptionRefiners = typeof OPTION_REFINERS
export type TimeGridOptions = RawOptionsFromRefiners<TimeGridOptionRefiners>
export type TimeGridOptionsRefined = RefinedOptionsFromRefiners<TimeGridOptionRefiners>
