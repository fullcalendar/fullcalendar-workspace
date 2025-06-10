import { ClassNamesGenerator, ClassNamesInput, CustomContentGenerator, DidMountHandler, WillUnmountHandler } from '@fullcalendar/core'
import { createFormatter, Identity, identity, RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/core/internal'
import { DayCellData, DayCellMountData, DayHeaderData, DayHeaderMountData } from './structs.js'

export const OPTION_REFINERS = {
  dayHeaders: Boolean,
  dayHeaderFormat: createFormatter,

  dayHeaderClass: identity as Identity<ClassNamesGenerator<DayHeaderData>>,
  dayHeaderInnerClass: identity as Identity<ClassNamesGenerator<DayHeaderData>>,
  dayHeaderContent: identity as Identity<CustomContentGenerator<DayHeaderData>>,
  dayHeaderDidMount: identity as Identity<DidMountHandler<DayHeaderMountData>>,
  dayHeaderWillUnmount: identity as Identity<WillUnmountHandler<DayHeaderMountData>>,

  dayHeaderDividerClass: identity as Identity<ClassNamesInput>,
  dayHeaderRowClass: identity as Identity<ClassNamesInput>,
  dayRowClass: identity as Identity<ClassNamesInput>,

  dayCellDidMount: identity as Identity<DidMountHandler<DayCellMountData>>,
  dayCellWillUnmount: identity as Identity<WillUnmountHandler<DayCellMountData>>,
  dayCellClass: identity as Identity<ClassNamesGenerator<DayCellData>>,
  dayCellInnerClass: identity as Identity<ClassNamesGenerator<DayCellData>>,
  dayCellTopContent: identity as Identity<CustomContentGenerator<DayCellData>>,
  dayCellTopClass: identity as Identity<ClassNamesGenerator<DayCellData>>,
  dayCellTopInnerClass: identity as Identity<ClassNamesGenerator<DayCellData>>,
  dayCellBottomClass: identity as Identity<ClassNamesGenerator<DayCellData>>,
}

type DayGridOptionRefiners = typeof OPTION_REFINERS
export type DayGridOptions = RawOptionsFromRefiners<DayGridOptionRefiners>
export type DayGridOptionsRefined = RefinedOptionsFromRefiners<DayGridOptionRefiners>

export const OPTION_DEFAULTS = {
  dayHeaders: true,
}
