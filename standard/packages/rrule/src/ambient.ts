import {} from '@fullcalendar/core-types/protected-api'
import { RRULE_EVENT_REFINERS } from './event-refiners'

type ExtraRefiners = typeof RRULE_EVENT_REFINERS

declare module '@fullcalendar/core-types/protected-api' {
  interface EventRefiners extends ExtraRefiners {}
}
