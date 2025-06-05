import { ClassNamesGenerator } from '@fullcalendar/core'
import { createFormatter, DidMountHandler, Identity, identity, RawOptionsFromRefiners, RefinedOptionsFromRefiners, WillUnmountHandler } from '@fullcalendar/core/internal'
import { SingleMonthContentArg, SingleMonthMountArg, SingleMonthTitleArg } from './structs.js'

export const OPTION_REFINERS = {
  multiMonthMaxColumns: Number,

  singleMonthMinWidth: Number,
  singleMonthTitleFormat: createFormatter,
  singleMonthDidMount: identity as Identity<DidMountHandler<SingleMonthMountArg>>,
  singleMonthWillUnmount: identity as Identity<WillUnmountHandler<SingleMonthMountArg>>,
  singleMonthClassNames: identity as Identity<ClassNamesGenerator<SingleMonthContentArg>>,
  singleMonthTitleClassNames: identity as Identity<ClassNamesGenerator<SingleMonthTitleArg>>,
}

type MultiMonthOptionRefiners = typeof OPTION_REFINERS
export type MultiMonthOptions = RawOptionsFromRefiners<MultiMonthOptionRefiners>
export type MultiMonthOptionsRefined = RefinedOptionsFromRefiners<MultiMonthOptionRefiners>
