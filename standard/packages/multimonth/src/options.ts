import { ClassNameGenerator } from '@fullcalendar/core'
import { createFormatter, DidMountHandler, Identity, identity, RawOptionsFromRefiners, RefinedOptionsFromRefiners, WillUnmountHandler } from '@fullcalendar/core/internal'
import { SingleMonthData, SingleMonthMountData, SingleMonthHeaderData } from './structs.js'

export const OPTION_REFINERS = {
  multiMonthMaxColumns: Number,

  singleMonthMinWidth: Number,
  singleMonthTitleFormat: createFormatter,
  singleMonthDidMount: identity as Identity<DidMountHandler<SingleMonthMountData>>,
  singleMonthWillUnmount: identity as Identity<WillUnmountHandler<SingleMonthMountData>>,
  singleMonthClass: identity as Identity<ClassNameGenerator<SingleMonthData>>,
  singleMonthHeaderClass: identity as Identity<ClassNameGenerator<SingleMonthHeaderData>>,
  singleMonthHeaderInnerClass: identity as Identity<ClassNameGenerator<SingleMonthHeaderData>>,
}

type MultiMonthOptionRefiners = typeof OPTION_REFINERS
export type MultiMonthOptions = RawOptionsFromRefiners<MultiMonthOptionRefiners>
export type MultiMonthOptionsRefined = RefinedOptionsFromRefiners<MultiMonthOptionRefiners>
