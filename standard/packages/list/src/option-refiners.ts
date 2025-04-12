import { ClassNamesGenerator, FormatterInput } from '@fullcalendar/core'
import {
  identity,
  Identity,
  CustomContentGenerator,
  DidMountHandler,
  WillUnmountHandler,
  createFormatter,
  DateFormatter,
} from '@fullcalendar/core/internal'
import {
  ListDayHeaderContentArg,
  ListDayHeaderMountArg,
  NoEventsContentArg,
  NoEventsMountArg,
} from './public-types.js'

export const OPTION_REFINERS = {
  listDayFormat: createFalsableFormatter, // defaults specified in list plugins
  listDaySideFormat: createFalsableFormatter, // "

  listDayHeaderClassNames: identity as Identity<ClassNamesGenerator<ListDayHeaderContentArg>>,
  listDayHeaderContent: identity as Identity<CustomContentGenerator<ListDayHeaderContentArg>>,
  listDayHeaderDidMount: identity as Identity<DidMountHandler<ListDayHeaderMountArg>>,
  listDayHeaderWillUnmount: identity as Identity<WillUnmountHandler<ListDayHeaderMountArg>>,

  noEventsClassNames: identity as Identity<ClassNamesGenerator<NoEventsContentArg>>,
  noEventsInnerClassNames: identity as Identity<ClassNamesGenerator<NoEventsContentArg>>,
  noEventsContent: identity as Identity<CustomContentGenerator<NoEventsContentArg>>,
  noEventsDidMount: identity as Identity<DidMountHandler<NoEventsMountArg>>,
  noEventsWillUnmount: identity as Identity<WillUnmountHandler<NoEventsMountArg>>,

  // noEventsText is defined in base options
}

function createFalsableFormatter(input: FormatterInput | false): DateFormatter {
  return input === false ? null : createFormatter(input)
}
