import { ClassNameInput } from '@fullcalendar/core'
import { ClassNameGenerator, FormatterInput } from '@fullcalendar/core'
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
  listDaysClass: identity as Identity<ClassNameInput>,  // rename this?
  listDayClass: identity as Identity<ClassNameGenerator<ListDayData>>,

  listDayFormat: createFalsableFormatter, // defaults specified in list plugins
  listDaySideFormat: createFalsableFormatter, // "

  listDayHeaderDidMount: identity as Identity<DidMountHandler<ListDayHeaderMountData>>,
  listDayHeaderWillUnmount: identity as Identity<WillUnmountHandler<ListDayHeaderMountData>>,
  listDayHeaderClass: identity as Identity<ClassNameGenerator<ListDayHeaderData>>,
  listDayHeaderColorClass: identity as Identity<ClassNameGenerator<ListDayHeaderInnerData>>,
  listDayHeaderInnerClass: identity as Identity<ClassNameGenerator<ListDayHeaderInnerData>>,
  listDayHeaderContent: identity as Identity<CustomContentGenerator<ListDayHeaderInnerData>>,

  listDayEventsClass: identity as Identity<ClassNameGenerator<ListDayData>>,

  noEventsClass: identity as Identity<ClassNameGenerator<NoEventsData>>,
  noEventsInnerClass: identity as Identity<ClassNameGenerator<NoEventsData>>,
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
