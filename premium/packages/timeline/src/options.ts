import { ClassNamesInput } from '@fullcalendar/core'
import { Identity, identity, RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/core/internal'

export const OPTION_REFINERS = {
  timelineTopClassNames: identity as Identity<ClassNamesInput>,
  timelineBottomClassNames: identity as Identity<ClassNamesInput>,
}

type TimelineOptionRefiners = typeof OPTION_REFINERS
export type TimelineOptions = RawOptionsFromRefiners<TimelineOptionRefiners>
export type TimelineOptionsRefined = RefinedOptionsFromRefiners<TimelineOptionRefiners>
