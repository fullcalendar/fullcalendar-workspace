import { DayTableModel, DayTableCell, SlicedCoordRange } from '@fullcalendar/core/internal'
import { Resource } from '../structs/resource.js'
import { ResourceIndex } from './ResourceIndex.js'

/*
TODO: move this so @fullcalendar/resource-daygrid
*/
export abstract class AbstractResourceDayTableModel {
  cells: DayTableCell[][]
  resourceIndex: ResourceIndex

  constructor(
    public dayTableModel: DayTableModel,
    public resources: Resource[],
    public rowCount: number,
    public colCount: number
  ) {
    this.resourceIndex = new ResourceIndex(resources)
    this.cells = this.buildCells()
  }

  abstract computeCol(dateI: number, resourceI: number): number

  abstract computeColRanges(dateStartI: number, dateEndI: number, resourceI: number): SlicedCoordRange[]

  abstract buildCells(): DayTableCell[][]
}
