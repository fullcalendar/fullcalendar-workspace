import { Dictionary, identity, Identity, RawOptionsFromRefiners, RefinedOptionsFromRefiners } from "@fullcalendar/core/internal"

export const OPTION_REFINERS = {
  googleCalendarApiKey: String,
}

type GoogleCalendarOptionRefiners = typeof OPTION_REFINERS
export type GoogleCalendarOptions = RawOptionsFromRefiners<GoogleCalendarOptionRefiners>
export type GoogleCalendarOptionsRefined = RefinedOptionsFromRefiners<GoogleCalendarOptionRefiners>

export const EVENT_SOURCE_REFINERS = {
  googleCalendarApiKey: String, // TODO: rename with no prefix?
  googleCalendarId: String,
  googleCalendarApiBase: String,
  extraParams: identity as Identity<Dictionary | (() => Dictionary)>,
}

type GoogleCalendarEventSourceRefiners = typeof EVENT_SOURCE_REFINERS
export type GoogleCalendarEventSourceOptions = RawOptionsFromRefiners<GoogleCalendarEventSourceRefiners>
export type GoogleCalendarEventSourceOptionsRefined = RefinedOptionsFromRefiners<GoogleCalendarEventSourceRefiners>
