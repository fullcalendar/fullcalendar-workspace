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
  ResourceDayHeaderData,
  ResourceDayHeaderMountData,
} from './structs.js'

export const OPTION_REFINERS = {
  resourceDayHeaderClassNames: identity as Identity<ClassNamesGenerator<ResourceDayHeaderData>>,
  resourceDayHeaderInnerClassNames: identity as Identity<ClassNamesGenerator<ResourceDayHeaderData>>,
  resourceDayHeaderContent: identity as Identity<CustomContentGenerator<ResourceDayHeaderData>>,
  resourceDayHeaderDidMount: identity as Identity<DidMountHandler<ResourceDayHeaderMountData>>,
  resourceDayHeaderWillUnmount: identity as Identity<WillUnmountHandler<ResourceDayHeaderMountData>>,
}

type ResourceDayGridOptionRefiners = typeof OPTION_REFINERS
export type ResourceDayGridOptions = RawOptionsFromRefiners<ResourceDayGridOptionRefiners>
export type ResourceDayGridOptionsRefined = RefinedOptionsFromRefiners<ResourceDayGridOptionRefiners>
