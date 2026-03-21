import { MountData } from '../common/render-hook'

export interface SingleMonthData {
  multiMonthColumnCount: number // initially 0 (unknown)
}

export type SingleMonthMountData = MountData<SingleMonthData>

export type SingleMonthHeaderData = SingleMonthData & {
  isSticky: boolean
  isNarrow: boolean // TODO: should SingleMonthData have this?
  hasNavLink: boolean
}
