import {
  InteractionOptions,
  InteractionOptionsRefined,
  InteractionListeners,
  InteractionListenersRefined,
} from './options'

declare module '../../internal' {
  interface BaseOptions extends InteractionOptions {}
  interface BaseOptionsRefined extends InteractionOptionsRefined {}

  interface CalendarListeners extends InteractionListeners {}
  interface CalendarListenersRefined extends InteractionListenersRefined {}
}
