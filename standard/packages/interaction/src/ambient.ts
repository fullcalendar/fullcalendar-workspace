import {
  InteractionOptions,
  InteractionOptionsRefined,
  InteractionListeners,
  InteractionListenersRefined,
} from './options.js'

declare module '@fullcalendar/core/internal' {
  interface BaseOptions extends InteractionOptions {}
  interface BaseOptionsRefined extends InteractionOptionsRefined {}

  interface CalendarListeners extends InteractionListeners {}
  interface CalendarListenersRefined extends InteractionListenersRefined {}
}
