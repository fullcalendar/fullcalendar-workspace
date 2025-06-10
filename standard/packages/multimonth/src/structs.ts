import { MountData } from "@fullcalendar/core/internal";

export interface SingleMonthContentArg {
  colCount: number | undefined // initially unknown
}

export type SingleMonthMountArg = MountData<SingleMonthContentArg>

export interface SingleMonthTitleArg {
  isSticky: boolean
  isCompact: boolean
}

