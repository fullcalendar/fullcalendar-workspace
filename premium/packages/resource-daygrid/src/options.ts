import { ClassNamesGenerator } from '@fullcalendar/core'
import {
  Identity,
  identity,
  CustomContentGenerator,
  DidMountHandler,
  WillUnmountHandler,
  RawOptionsFromRefiners,
  RefinedOptionsFromRefiners,
} from '@fullcalendar/core/internal'
import {
  ResourceDayHeaderContentArg,
  ResourceDayHeaderMountArg,
} from './structs.js'

export const OPTION_REFINERS = {
  resourceDayHeaderClassNames: identity as Identity<ClassNamesGenerator<ResourceDayHeaderContentArg>>,
  resourceDayHeaderInnerClassNames: identity as Identity<ClassNamesGenerator<ResourceDayHeaderContentArg>>,
  resourceDayHeaderContent: identity as Identity<CustomContentGenerator<ResourceDayHeaderContentArg>>,
  resourceDayHeaderDidMount: identity as Identity<DidMountHandler<ResourceDayHeaderMountArg>>,
  resourceDayHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceDayHeaderMountArg>>,
}

type ResourceDayGridOptionRefiners = typeof OPTION_REFINERS
export type ResourceDayGridOptions = RawOptionsFromRefiners<ResourceDayGridOptionRefiners>
export type ResourceDayGridOptionsRefined = RefinedOptionsFromRefiners<ResourceDayGridOptionRefiners>
