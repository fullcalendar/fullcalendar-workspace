import { DateMeta } from './component-util/date-rendering.js'
import { Duration } from './datelib/duration.js'
import { ViewApi } from './api/ViewApi.js'
import { MountArg } from './common/render-hook.js'

export interface SlotLaneContentArg extends DateMeta {
  time?: Duration
  isMajor: boolean
  isMinor: boolean
  view: ViewApi
}
export type SlotLaneMountArg = MountArg<SlotLaneContentArg>

export interface SlotLabelContentArg extends SlotLaneContentArg {
  level: number
  text: string
  isCompact: boolean
}
export type SlotLabelMountArg = MountArg<SlotLabelContentArg>

export interface AllDayContentArg {
  text: string
  view: ViewApi
  isCompact: boolean
}
export type AllDayMountArg = MountArg<AllDayContentArg>
