import { DateMeta } from './component-util/date-rendering.js'
import { Duration } from './datelib/duration.js'
import { ViewApi } from './api/ViewApi.js'
import { MountData } from './common/render-hook.js'

export interface SlotLaneContentArg extends DateMeta {
  time?: Duration
  isMajor: boolean
  isMinor: boolean
  view: ViewApi
}
export type SlotLaneMountArg = MountData<SlotLaneContentArg>

export interface SlotLabelContentArg extends SlotLaneContentArg {
  level: number
  text: string
  isCompact: boolean
}
export type SlotLabelMountArg = MountData<SlotLabelContentArg>

export interface AllDayHeaderData {
  text: string
  view: ViewApi
  isCompact: boolean
}
export type AllDayHeaderMountData = MountData<AllDayHeaderData>
