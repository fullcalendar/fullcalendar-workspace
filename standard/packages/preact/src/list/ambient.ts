import { ListOptions, ListOptionsRefined } from './options'

declare module '../../internal' {
  interface BaseOptions extends ListOptions {}
  interface BaseOptionsRefined extends ListOptionsRefined {}
}
