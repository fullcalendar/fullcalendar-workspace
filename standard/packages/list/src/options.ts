import { ClassNamesGenerator, FormatterInput } from '@fullcalendar/core'
import {
  identity,
  Identity,
  CustomContentGenerator,
  DidMountHandler,
  WillUnmountHandler,
  createFormatter,
  DateFormatter,
  RawOptionsFromRefiners,
  RefinedOptionsFromRefiners,
} from '@fullcalendar/core/internal'
import {
  ListDayArg,
  ListDayHeaderArg,
  ListDayHeaderMountData,
  ListDayHeaderInnerArg,
  NoEventsData,
  NoEventsMountData,
} from './public-types.js'

export const OPTION_REFINERS = {
  listDayClassNames: identity as Identity<ClassNamesGenerator<ListDayArg>>,

  listDayFormat: createFalsableFormatter, // defaults specified in list plugins
  listDaySideFormat: createFalsableFormatter, // "

  listDayHeaderDidMount: identity as Identity<DidMountHandler<ListDayHeaderMountData>>,
  listDayHeaderWillUnmount: identity as Identity<WillUnmountHandler<ListDayHeaderMountData>>,
  listDayHeaderClassNames: identity as Identity<ClassNamesGenerator<ListDayHeaderArg>>,
  listDayHeaderBeforeClassNames: identity as Identity<ClassNamesGenerator<ListDayHeaderArg>>,
  listDayHeaderInnerClassNames: identity as Identity<ClassNamesGenerator<ListDayHeaderInnerArg>>,
  listDayHeaderContent: identity as Identity<CustomContentGenerator<ListDayHeaderInnerArg>>,

  noEventsClassNames: identity as Identity<ClassNamesGenerator<NoEventsData>>,
  noEventsInnerClassNames: identity as Identity<ClassNamesGenerator<NoEventsData>>,
  noEventsContent: identity as Identity<CustomContentGenerator<NoEventsData>>,
  noEventsDidMount: identity as Identity<DidMountHandler<NoEventsMountData>>,
  noEventsWillUnmount: identity as Identity<WillUnmountHandler<NoEventsMountData>>,

  // noEventsText is defined in base options
}

type ListOptionRefiners = typeof OPTION_REFINERS
export type ListOptions = RawOptionsFromRefiners<ListOptionRefiners>
export type ListOptionsRefined = RefinedOptionsFromRefiners<ListOptionRefiners>

function createFalsableFormatter(input: FormatterInput | false): DateFormatter {
  return input === false ? null : createFormatter(input)
}
