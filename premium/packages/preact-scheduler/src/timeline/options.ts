import { RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/core/protected-api'
import { refineClassName } from '@fullcalendar/preact/protected-api'

export const OPTION_REFINERS = {
  timelineTopClass: refineClassName,
  timelineBottomClass: refineClassName,
}

type TimelineOptionRefiners = typeof OPTION_REFINERS
export type TimelineOptions = RawOptionsFromRefiners<TimelineOptionRefiners>
export type TimelineOptionsRefined = RefinedOptionsFromRefiners<TimelineOptionRefiners>
