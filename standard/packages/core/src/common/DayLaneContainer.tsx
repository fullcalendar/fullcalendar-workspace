import { ViewApi } from '../api/ViewApi.js'
import { DateMeta } from '../component-util/date-rendering.js'
import { hasCustomRenderingHandler } from '../content-inject/ContentInjector.js'
import { DateMarker } from '../datelib/marker.js'
import { ViewOptions } from '../options.js'
import { MountArg } from './render-hook.js'

export interface DayLaneContentArg extends DateMeta {
  date: DateMarker // localized
  isSimple: boolean
  isMajor: boolean
  view: ViewApi
  [extraProp: string]: any // so can include a resource
}

export type DayLaneMountArg = MountArg<DayLaneContentArg>

export function hasCustomDayLaneContent(options: ViewOptions): boolean {
  return Boolean(options.dayLaneContent || hasCustomRenderingHandler('dayLaneContent', options))
}
