import { ClassNamesGenerator, ClassNamesInput, CustomContentGenerator, DidMountHandler, WillUnmountHandler } from '@fullcalendar/core'
import { createFormatter, Identity, identity, RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/core/internal'
import { DayCellContentArg, DayCellMountArg, DayHeaderContentArg, DayHeaderMountArg } from './structs.js'

export const OPTION_REFINERS = {
  dayHeaders: Boolean,
  dayHeaderFormat: createFormatter,

  dayHeaderClassNames: identity as Identity<ClassNamesGenerator<DayHeaderContentArg>>,
  dayHeaderInnerClassNames: identity as Identity<ClassNamesGenerator<DayHeaderContentArg>>,
  dayHeaderContent: identity as Identity<CustomContentGenerator<DayHeaderContentArg>>,
  dayHeaderDidMount: identity as Identity<DidMountHandler<DayHeaderMountArg>>,
  dayHeaderWillUnmount: identity as Identity<WillUnmountHandler<DayHeaderMountArg>>,

  dayHeaderDividerClassNames: identity as Identity<ClassNamesInput>,
  dayHeaderRowClassNames: identity as Identity<ClassNamesInput>,
  dayRowClassNames: identity as Identity<ClassNamesInput>,

  dayCellDidMount: identity as Identity<DidMountHandler<DayCellMountArg>>,
  dayCellWillUnmount: identity as Identity<WillUnmountHandler<DayCellMountArg>>,
  dayCellClassNames: identity as Identity<ClassNamesGenerator<DayCellContentArg>>,
  dayCellInnerClassNames: identity as Identity<ClassNamesGenerator<DayCellContentArg>>,
  dayCellTopContent: identity as Identity<CustomContentGenerator<DayCellContentArg>>,
  dayCellTopClassNames: identity as Identity<ClassNamesGenerator<DayCellContentArg>>,
  dayCellTopInnerClassNames: identity as Identity<ClassNamesGenerator<DayCellContentArg>>,
  dayCellBottomClassNames: identity as Identity<ClassNamesGenerator<DayCellContentArg>>,
}

type DayGridOptionRefiners = typeof OPTION_REFINERS
export type DayGridOptions = RawOptionsFromRefiners<DayGridOptionRefiners>
export type DayGridOptionsRefined = RefinedOptionsFromRefiners<DayGridOptionRefiners>

export const OPTION_DEFAULTS = {
  dayHeaders: true,
}
