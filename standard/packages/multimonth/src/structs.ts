import { MountData } from "@fullcalendar/core/internal";

export interface SingleMonthData {
  colCount: number // initially 0 (unknown)
}

export type SingleMonthMountData = MountData<SingleMonthData>

export interface SingleMonthHeaderData {
  colCount: number // initially 0 (unknown)
  isSticky: boolean
  isCompact: boolean
  hasNavLink: boolean
}
