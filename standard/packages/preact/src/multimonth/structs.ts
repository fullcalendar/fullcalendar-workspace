import { MountData } from '../common/render-hook'

export interface SingleMonthData {
  multiMonthColumnCount: number // initially 0 (unknown)
  isFirst: boolean
  isLast: boolean
}

export type SingleMonthMountData = MountData<SingleMonthData>

export type SingleMonthHeaderData = {
  isSticky: boolean
  isNarrow: boolean // TODO: should SingleMonthData have this?
  hasNavLink: boolean
  multiMonthColumnCount: number // initially 0 (unknown)
}
