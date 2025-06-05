import { MountArg } from "@fullcalendar/core/internal";

export interface SingleMonthContentArg {
  colCount: number | undefined // initially unknown
}

export type SingleMonthMountArg = MountArg<SingleMonthContentArg>

export interface SingleMonthTitleArg {
  isSticky: boolean
}

