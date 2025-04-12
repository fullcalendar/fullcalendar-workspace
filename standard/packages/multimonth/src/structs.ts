import { MountArg } from "@fullcalendar/core/internal";

export interface SingleMonthContentArg {
  colCnt?: number // initially unknown
  isFirst: boolean
  isLast: boolean
}

export type SingleMonthMountArg = MountArg<SingleMonthContentArg>

export interface SingleMonthTitleArg {
  isSticky: boolean
}

export interface SingleMonthHeaderArg {
  isSticky: boolean
}
