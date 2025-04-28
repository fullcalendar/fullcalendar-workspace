import { ListOptions, ListOptionsRefined } from './options.js'

declare module '@fullcalendar/core/internal' {
  interface BaseOptions extends ListOptions {}
  interface BaseOptionsRefined extends ListOptionsRefined {}
}
