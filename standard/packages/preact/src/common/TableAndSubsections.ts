
export type TableData = {
  borderlessX: boolean
  borderlessTop: boolean
  borderlessBottom: boolean
  colCount: number
  // view: ViewApi -- TODO when easier
}

export type TableHeaderData = TableData & {
  isSticky: boolean
}

export type TableBodyData = TableData
