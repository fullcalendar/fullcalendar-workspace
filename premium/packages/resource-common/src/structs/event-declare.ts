import { EVENT_REFINERS } from './event-parse.js'

type ExtraEventRefiners = typeof EVENT_REFINERS

declare module '@fullcalendar/core' {
  interface EventRefiners extends ExtraEventRefiners {}
}
