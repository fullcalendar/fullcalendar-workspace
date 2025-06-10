import { ClassNameGenerator } from '@fullcalendar/core'
import { createFormatter, DidMountHandler, Identity, identity, RawOptionsFromRefiners, RefinedOptionsFromRefiners, WillUnmountHandler } from '@fullcalendar/core/internal'
import { SingleMonthData, SingleMonthMountData, SingleMonthTitleData } from './structs.js'

export const OPTION_REFINERS = {
  multiMonthMaxColumns: Number,

  singleMonthMinWidth: Number,
  singleMonthTitleFormat: createFormatter,
  singleMonthDidMount: identity as Identity<DidMountHandler<SingleMonthMountData>>,
  singleMonthWillUnmount: identity as Identity<WillUnmountHandler<SingleMonthMountData>>,
  singleMonthClass: identity as Identity<ClassNameGenerator<SingleMonthData>>,
  singleMonthTitleClass: identity as Identity<ClassNameGenerator<SingleMonthTitleData>>,
}

type MultiMonthOptionRefiners = typeof OPTION_REFINERS
export type MultiMonthOptions = RawOptionsFromRefiners<MultiMonthOptionRefiners>
export type MultiMonthOptionsRefined = RefinedOptionsFromRefiners<MultiMonthOptionRefiners>
