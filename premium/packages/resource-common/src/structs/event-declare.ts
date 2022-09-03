import { EVENT_REFINERS } from './event-parse'

type ExtraEventRefiners = typeof EVENT_REFINERS

declare module '@fullcalendar/common' {
  interface EventRefiners extends ExtraEventRefiners {}
}
