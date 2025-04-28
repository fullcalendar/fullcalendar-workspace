import '@fullcalendar/daygrid'

import { MultiMonthOptions, MultiMonthOptionsRefined } from './options.js'

declare module '@fullcalendar/core/internal' {
  interface BaseOptions extends MultiMonthOptions {}
  interface BaseOptionsRefined extends MultiMonthOptionsRefined {}
}
