import { ClassNameGenerator, ClassNameInput, CustomContentGenerator, DidMountHandler, WillUnmountHandler } from '@fullcalendar/core'
import { createFormatter, Identity, identity, RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/core/internal'
import { DayCellData, DayCellMountData, DayHeaderData, DayHeaderMountData } from './structs.js'

export const OPTION_REFINERS = {
  dayHeaders: Boolean,
  dayHeaderFormat: createFormatter,

  dayHeaderClass: identity as Identity<ClassNameGenerator<DayHeaderData>>,
  dayHeaderInnerClass: identity as Identity<ClassNameGenerator<DayHeaderData>>,
  dayHeaderContent: identity as Identity<CustomContentGenerator<DayHeaderData>>,
  dayHeaderDidMount: identity as Identity<DidMountHandler<DayHeaderMountData>>,
  dayHeaderWillUnmount: identity as Identity<WillUnmountHandler<DayHeaderMountData>>,

  dayHeaderDividerClass: identity as Identity<ClassNameInput>,
  dayHeaderRowClass: identity as Identity<ClassNameInput>,
  dayRowClass: identity as Identity<ClassNameInput>,

  dayCellDidMount: identity as Identity<DidMountHandler<DayCellMountData>>,
  dayCellWillUnmount: identity as Identity<WillUnmountHandler<DayCellMountData>>,
  dayCellClass: identity as Identity<ClassNameGenerator<DayCellData>>,
  dayCellInnerClass: identity as Identity<ClassNameGenerator<DayCellData>>,
  dayCellTopContent: identity as Identity<CustomContentGenerator<DayCellData>>,
  dayCellTopClass: identity as Identity<ClassNameGenerator<DayCellData>>,
  dayCellTopInnerClass: identity as Identity<ClassNameGenerator<DayCellData>>,
  dayCellBottomClass: identity as Identity<ClassNameGenerator<DayCellData>>,
}

type DayGridOptionRefiners = typeof OPTION_REFINERS
export type DayGridOptions = RawOptionsFromRefiners<DayGridOptionRefiners>
export type DayGridOptionsRefined = RefinedOptionsFromRefiners<DayGridOptionRefiners>

export const OPTION_DEFAULTS = {
  dayHeaders: true,
}
