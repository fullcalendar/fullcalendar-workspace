import { ClassNamesGenerator, ClassNamesInput, CustomContentGenerator, DidMountHandler, WillUnmountHandler } from '@fullcalendar/core'
import { createFormatter, Identity, identity, RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/core/internal'
import { DayCellData, DayCellMountData, DayHeaderData, DayHeaderMountData } from './structs.js'

export const OPTION_REFINERS = {
  dayHeaders: Boolean,
  dayHeaderFormat: createFormatter,

  dayHeaderClassNames: identity as Identity<ClassNamesGenerator<DayHeaderData>>,
  dayHeaderInnerClassNames: identity as Identity<ClassNamesGenerator<DayHeaderData>>,
  dayHeaderContent: identity as Identity<CustomContentGenerator<DayHeaderData>>,
  dayHeaderDidMount: identity as Identity<DidMountHandler<DayHeaderMountData>>,
  dayHeaderWillUnmount: identity as Identity<WillUnmountHandler<DayHeaderMountData>>,

  dayHeaderDividerClassNames: identity as Identity<ClassNamesInput>,
  dayHeaderRowClassNames: identity as Identity<ClassNamesInput>,
  dayRowClassNames: identity as Identity<ClassNamesInput>,

  dayCellDidMount: identity as Identity<DidMountHandler<DayCellMountData>>,
  dayCellWillUnmount: identity as Identity<WillUnmountHandler<DayCellMountData>>,
  dayCellClassNames: identity as Identity<ClassNamesGenerator<DayCellData>>,
  dayCellInnerClassNames: identity as Identity<ClassNamesGenerator<DayCellData>>,
  dayCellTopContent: identity as Identity<CustomContentGenerator<DayCellData>>,
  dayCellTopClassNames: identity as Identity<ClassNamesGenerator<DayCellData>>,
  dayCellTopInnerClassNames: identity as Identity<ClassNamesGenerator<DayCellData>>,
  dayCellBottomClassNames: identity as Identity<ClassNamesGenerator<DayCellData>>,
}

type DayGridOptionRefiners = typeof OPTION_REFINERS
export type DayGridOptions = RawOptionsFromRefiners<DayGridOptionRefiners>
export type DayGridOptionsRefined = RefinedOptionsFromRefiners<DayGridOptionRefiners>

export const OPTION_DEFAULTS = {
  dayHeaders: true,
}
