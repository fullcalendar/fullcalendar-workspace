import { ListOptions, ListOptionsRefined } from './options'

declare module '@fullcalendar/core/internal' {
  interface BaseOptions extends ListOptions {}
  interface BaseOptionsRefined extends ListOptionsRefined {}
}
