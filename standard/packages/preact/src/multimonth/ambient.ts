import '../daygrid/ambient'

import { MultiMonthOptions, MultiMonthOptionsRefined } from './options'

declare module '../options' {
  interface BaseOptions extends MultiMonthOptions {}
  interface BaseOptionsRefined extends MultiMonthOptionsRefined {}
}
