import { ClassNamesGenerator } from '@fullcalendar/core'
import { createFormatter, DidMountHandler, Identity, identity, WillUnmountHandler } from '@fullcalendar/core/internal'
import { SingleMonthContentArg, SingleMonthTableHeaderArg, SingleMonthMountArg, SingleMonthTitleArg, SingleMonthTableBodyArg, SingleMonthTableArg } from './structs.js'

export const OPTION_REFINERS = {
  multiMonthMaxColumns: Number,

  singleMonthMinWidth: Number,
  singleMonthTitleFormat: createFormatter,
  singleMonthDidMount: identity as Identity<DidMountHandler<SingleMonthMountArg>>,
  singleMonthWillUnmount: identity as Identity<WillUnmountHandler<SingleMonthMountArg>>,
  singleMonthClassNames: identity as Identity<ClassNamesGenerator<SingleMonthContentArg>>,
  singleMonthTitleClassNames: identity as Identity<ClassNamesGenerator<SingleMonthTitleArg>>,
  singleMonthTableClassNames: identity as Identity<ClassNamesGenerator<SingleMonthTableArg>>,
  singleMonthTableHeaderClassNames: identity as Identity<ClassNamesGenerator<SingleMonthTableHeaderArg>>,
  singleMonthTableBodyClassNames: identity as Identity<ClassNamesGenerator<SingleMonthTableBodyArg>>,
}
