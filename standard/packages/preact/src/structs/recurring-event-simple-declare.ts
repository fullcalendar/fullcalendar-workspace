import {} from '@fullcalendar/core-types/protected-api'
import { SIMPLE_RECURRING_REFINERS } from './recurring-event-simple-refiners'

type ExtraRefiners = typeof SIMPLE_RECURRING_REFINERS

declare module '@fullcalendar/core-types/protected-api' {
  interface EventRefiners extends ExtraRefiners {}
}
