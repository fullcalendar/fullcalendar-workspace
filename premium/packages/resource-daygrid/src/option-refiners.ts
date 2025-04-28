import { ClassNamesGenerator } from '@fullcalendar/core'
import {
  Identity,
  identity,
  CustomContentGenerator,
  DidMountHandler,
  WillUnmountHandler,
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
