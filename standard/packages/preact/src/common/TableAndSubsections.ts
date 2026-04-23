
export type TableDisplayInfo = {
  borderlessX: boolean
  borderlessTop: boolean
  borderlessBottom: boolean
  multiMonthColumnCount: number
  // view: ViewApi -- TODO when easier
}

export type TableHeaderInfo = TableDisplayInfo & {
  isSticky: boolean
}

export type TableBodyInfo = TableDisplayInfo
