import { MountData } from "@fullcalendar/core/internal";

export interface SingleMonthData {
  colCount: number | undefined // initially unknown
}

export type SingleMonthMountData = MountData<SingleMonthData>

export interface SingleMonthTitleData {
  isSticky: boolean
  isCompact: boolean
}

