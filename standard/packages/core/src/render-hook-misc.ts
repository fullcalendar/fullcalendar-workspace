import { DateMeta } from './component-util/date-rendering.js'
import { Duration } from './datelib/duration.js'
import { ViewApi } from './api/ViewApi.js'
import { MountData } from './common/render-hook.js'

export interface SlotLaneData extends DateMeta {
  time?: Duration
  isMajor: boolean
  isMinor: boolean
  view: ViewApi
}
export type SlotLaneMountData = MountData<SlotLaneData>

export interface SlotLabelData extends SlotLaneData {
  level: number
  text: string
  isCompact: boolean
}
export type SlotLabelMountData = MountData<SlotLabelData>

export interface AllDayHeaderData {
  text: string
  view: ViewApi
  isCompact: boolean
}
export type AllDayHeaderMountData = MountData<AllDayHeaderData>
