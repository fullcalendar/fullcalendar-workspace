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
  ListDayData,
  ListDayHeaderData,
  ListDayHeaderMountData,
  ListDayHeaderInnerData,
  NoEventsData,
  NoEventsMountData,
} from './public-types.js'

export const OPTION_REFINERS = {
  listDayClass: identity as Identity<ClassNamesGenerator<ListDayData>>,

  listDayFormat: createFalsableFormatter, // defaults specified in list plugins
  listDaySideFormat: createFalsableFormatter, // "

  listDayHeaderDidMount: identity as Identity<DidMountHandler<ListDayHeaderMountData>>,
  listDayHeaderWillUnmount: identity as Identity<WillUnmountHandler<ListDayHeaderMountData>>,
  listDayHeaderClass: identity as Identity<ClassNamesGenerator<ListDayHeaderData>>,
  listDayHeaderBeforeClass: identity as Identity<ClassNamesGenerator<ListDayHeaderData>>,
  listDayHeaderInnerClass: identity as Identity<ClassNamesGenerator<ListDayHeaderInnerData>>,
  listDayHeaderContent: identity as Identity<CustomContentGenerator<ListDayHeaderInnerData>>,

  noEventsClass: identity as Identity<ClassNamesGenerator<NoEventsData>>,
  noEventsInnerClass: identity as Identity<ClassNamesGenerator<NoEventsData>>,
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
