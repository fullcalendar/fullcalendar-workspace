// all dependencies except core
import '@fullcalendar/daygrid'
import '@fullcalendar/premium-common'
import '@fullcalendar/resource'

import { OPTION_REFINERS } from './option-refiners.js'

type ExtraOptionRefiners = typeof OPTION_REFINERS

declare module '@fullcalendar/core/internal' {
  interface BaseOptionRefiners extends ExtraOptionRefiners {}
}
