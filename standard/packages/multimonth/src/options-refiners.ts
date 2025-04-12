import { ClassNamesInput, ClassNamesGenerator } from '@fullcalendar/core'
import { createFormatter, DidMountHandler, Identity, identity, WillUnmountHandler } from '@fullcalendar/core/internal'
import { SingleMonthContentArg, SingleMonthHeaderArg, SingleMonthMountArg, SingleMonthTitleArg } from './structs.js'

export const OPTION_REFINERS = {
  multiMonthMaxColumns: Number,

  singleMonthMinWidth: Number,
  singleMonthTitleFormat: createFormatter,
  singleMonthDidMount: identity as Identity<DidMountHandler<SingleMonthMountArg>>,
  singleMonthWillUnmount: identity as Identity<WillUnmountHandler<SingleMonthMountArg>>,
  singleMonthClassNames: identity as Identity<ClassNamesGenerator<SingleMonthContentArg>>,
  singleMonthTitleClassNames: identity as Identity<ClassNamesGenerator<SingleMonthTitleArg>>,
  singleMonthHeaderClassNames: identity as Identity<ClassNamesGenerator<SingleMonthHeaderArg>>,
  singleMonthBodyClassNames: identity as Identity<ClassNamesInput>,
}
