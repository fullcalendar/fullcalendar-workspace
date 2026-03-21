
export type TableDisplayData = {
  borderlessX: boolean
  borderlessTop: boolean
  borderlessBottom: boolean
  multiMonthColumnCount: number
  // view: ViewApi -- TODO when easier
}

export type TableHeaderData = TableDisplayData & {
  isSticky: boolean
}

export type TableBodyData = TableDisplayData
