import { MountArg } from "@fullcalendar/core/internal";

export interface SingleMonthContentArg {
  colCnt: number | undefined // used for borderX. initially unknown
  isFirst: boolean // used for borderY
  isLast: boolean // used for borderY
}

export type SingleMonthMountArg = MountArg<SingleMonthContentArg>

export interface SingleMonthTitleArg {
  sticky: boolean
  colCnt: number | undefined // initially unknown
}

export interface SingleMonthTableArg {
  stickyTitle: boolean
  colCnt: number | undefined // used for borderX. initially unknown
  isFirst: boolean // used for borderY
  isLast: boolean // used for borderY
}

export interface SingleMonthTableHeaderArg {
  sticky: boolean
  colCnt: number | undefined // used for borderX. initially unknown
}

export interface SingleMonthTableBodyArg {
  colCnt: number | undefined // used for borderX. initially unknown
}
