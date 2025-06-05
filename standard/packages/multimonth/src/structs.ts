import { MountArg } from "@fullcalendar/core/internal";

export interface SingleMonthContentArg {
  colCnt: number | undefined // initially unknown
}

export type SingleMonthMountArg = MountArg<SingleMonthContentArg>

export interface SingleMonthTitleArg {
  isSticky: boolean
}

