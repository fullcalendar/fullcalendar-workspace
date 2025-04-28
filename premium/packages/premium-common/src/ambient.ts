import { PremiumOptions, PremiumOptionsRefined } from './options.js'

declare module '@fullcalendar/core/internal' {
  interface BaseOptions extends PremiumOptions {}
  interface BaseOptionsRefined extends PremiumOptionsRefined {}
}
