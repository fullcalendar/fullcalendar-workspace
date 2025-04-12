import { DateMeta } from './component-util/date-rendering.js'
import { Duration } from './datelib/duration.js'
import { ViewApi } from './api/ViewApi.js'
import { MountArg } from './common/render-hook.js'

export interface SlotLaneContentArg extends Partial<DateMeta> { // TODO: move?
  date: Date
  time?: Duration
  isMajor: boolean
  isMinor: boolean
  view: ViewApi
  // this interface is for date-specific slots AND time-general slots. make an OR?
}
export type SlotLaneMountArg = MountArg<SlotLaneContentArg>

export interface SlotLabelContentArg { // TODO: move?
  level: number
  date: Date
  time?: Duration
  isMajor: boolean
  isMinor: boolean
  view: ViewApi
  text: string
}
export type SlotLabelMountArg = MountArg<SlotLabelContentArg>

export interface AllDayContentArg {
  text: string
  view: ViewApi
}
export type AllDayMountArg = MountArg<AllDayContentArg>
