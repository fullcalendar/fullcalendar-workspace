import { ClassNameInput } from '@fullcalendar/core'
import { Identity, identity, RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/core/internal'

export const OPTION_REFINERS = {
  timelineTopClass: identity as Identity<ClassNameInput>,
  timelineBottomClass: identity as Identity<ClassNameInput>,
}

type TimelineOptionRefiners = typeof OPTION_REFINERS
export type TimelineOptions = RawOptionsFromRefiners<TimelineOptionRefiners>
export type TimelineOptionsRefined = RefinedOptionsFromRefiners<TimelineOptionRefiners>
