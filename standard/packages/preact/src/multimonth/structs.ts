export interface SingleMonthInfo {
  multiMonthColumnCount: number // initially 0 (unknown)
  isFirst: boolean
  isLast: boolean
}

export type SingleMonthHeaderInfo = {
  isSticky: boolean
  isNarrow: boolean // TODO: should SingleMonthInfo have this?
  hasNavLink: boolean
  multiMonthColumnCount: number // initially 0 (unknown)
}
