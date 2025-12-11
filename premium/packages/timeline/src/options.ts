import { Identity, identity, RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/core/internal'

export const OPTION_REFINERS = {
  timelineTopClass: identity as Identity<string | undefined>,
  timelineBottomClass: identity as Identity<string | undefined>,
}

type TimelineOptionRefiners = typeof OPTION_REFINERS
export type TimelineOptions = RawOptionsFromRefiners<TimelineOptionRefiners>
export type TimelineOptionsRefined = RefinedOptionsFromRefiners<TimelineOptionRefiners>
