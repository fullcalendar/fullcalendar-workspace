import {
  GoogleCalendarOptions,
  GoogleCalendarOptionsRefined,
  GoogleCalendarEventSourceOptions,
  GoogleCalendarEventSourceOptionsRefined,
} from './options.js'

declare module '@fullcalendar/core/internal' {
  interface BaseOptions extends GoogleCalendarOptions {}
  interface BaseOptionsRefined extends GoogleCalendarOptionsRefined {}

  interface EventSourceOptions extends GoogleCalendarEventSourceOptions {}
  interface EventSourceOptionsRefined extends GoogleCalendarEventSourceOptionsRefined {}
}
