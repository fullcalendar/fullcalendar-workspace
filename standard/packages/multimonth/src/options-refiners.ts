import { createFormatter, DidMountHandler, Identity, identity, WillUnmountHandler } from '@fullcalendar/core/internal'
import { SingleMonthContentArg, SingleMonthMountArg } from './structs.js'
import { ClassNamesGenerator } from '../../core/src/index.js'

export const OPTION_REFINERS = {
  multiMonthMaxColumns: Number,

  singleMonthMinWidth: Number,
  singleMonthTitleFormat: createFormatter,
  singleMonthDidMount: identity as Identity<DidMountHandler<SingleMonthMountArg>>,
  singleMonthWillUnmount: identity as Identity<WillUnmountHandler<SingleMonthMountArg>>,
  singleMonthClassNames: identity as Identity<ClassNamesGenerator<SingleMonthContentArg>>,
}
