import {} from '@fullcalendar/core-types/protected-api'
import {
  GoogleCalendarOptions,
  GoogleCalendarOptionsRefined,
  GoogleCalendarEventSourceOptions,
  GoogleCalendarEventSourceOptionsRefined,
} from './options'

declare module '@fullcalendar/core-types/protected-api' {
  interface BaseOptions extends GoogleCalendarOptions {}
  interface BaseOptionsRefined extends GoogleCalendarOptionsRefined {}

  interface EventSourceOptions extends GoogleCalendarEventSourceOptions {}
  interface EventSourceOptionsRefined extends GoogleCalendarEventSourceOptionsRefined {}
}
