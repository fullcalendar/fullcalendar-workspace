import { PremiumOptions, PremiumOptionsRefined } from './options'

declare module '@fullcalendar/core/internal' {
  interface BaseOptions extends PremiumOptions {}
  interface BaseOptionsRefined extends PremiumOptionsRefined {}
}
