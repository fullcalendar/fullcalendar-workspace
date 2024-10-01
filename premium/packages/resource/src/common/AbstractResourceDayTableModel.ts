import { DayTableModel, DayTableCell } from '@fullcalendar/core/internal'
import { Resource } from '../structs/resource.js'
import { ResourceIndex } from './ResourceIndex.js'

export abstract class AbstractResourceDayTableModel {
  cells: DayTableCell[][]
  resourceIndex: ResourceIndex

  constructor(
    public dayTableModel: DayTableModel,
    public resources: Resource[],
    public rowCnt: number,
    public colCnt: number
  ) {
    this.resourceIndex = new ResourceIndex(resources)
    this.cells = this.buildCells()
  }

  abstract computeCol(dateI: number, resourceI: number): number

  abstract computeColRanges(dateStartI: number, dateEndI: number, resourceI: number): {
    firstCol: number,
    lastCol: number,
    isStart: boolean,
    isEnd: boolean
  }[]

  abstract buildCells(): DayTableCell[][]
}
