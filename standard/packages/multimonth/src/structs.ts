import { MountData } from "@fullcalendar/core/internal";

export interface SingleMonthData {
  colCount: number // initially 0 (unknown)
}

export type SingleMonthMountData = MountData<SingleMonthData>

export interface SingleMonthTitleData {
  isSticky: boolean
  isCompact: boolean
}

