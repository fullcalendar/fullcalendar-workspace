import { ClassNameGenerator, DidMountHandler, WillUnmountHandler } from '../common/render-hook'
import { createFormatter } from '../datelib/formatting'
import { Identity, identity, RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '../options'
import { SingleMonthData, SingleMonthMountData, SingleMonthHeaderData } from './structs'

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
