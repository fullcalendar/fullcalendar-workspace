import '@fullcalendar/daygrid'

import { MultiMonthOptions, MultiMonthOptionsRefined } from './options'

declare module '@fullcalendar/core/internal' {
  interface BaseOptions extends MultiMonthOptions {}
  interface BaseOptionsRefined extends MultiMonthOptionsRefined {}
}
