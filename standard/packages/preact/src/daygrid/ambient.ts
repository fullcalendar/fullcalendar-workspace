import { DayGridOptions, DayGridOptionsRefined } from './options'

declare module '../internal' {
  interface BaseOptions extends DayGridOptions {}
  interface BaseOptionsRefined extends DayGridOptionsRefined {}
}
