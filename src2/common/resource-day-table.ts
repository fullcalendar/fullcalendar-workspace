import { DayTable, DayTableSeg, DayTableCell, DateRange } from 'fullcalendar'
import { Resource } from '../structs/resource'

export interface ResourceDayTableCell extends DayTableCell {
  resource: Resource
}

export abstract class AbstractResourceDayTable {

  cells: ResourceDayTableCell[][]
  rowCnt: number
  colCnt: number
  dayTable: DayTable
  resources: Resource[]
  resourceIndex: ResourceIndex


  constructor(dayTable: DayTable, resources: Resource[]) {
    this.dayTable = dayTable
    this.resources = resources
    this.resourceIndex = new ResourceIndex(resources)

    this.rowCnt = dayTable.rowCnt
    this.colCnt = dayTable.colCnt * resources.length

    this.cells = this.buildCells()
  }


  abstract computeCol(dateI, resourceI): number


  sliceRange(range: DateRange, resourceIds: string[]): DayTableSeg[] {
    let { resourceIndex } = this

    if (!resourceIds.length) {
      resourceIds = resourceIndex.publicIds
    }

    let rawSegs = this.dayTable.sliceRange(range)
    let segs: DayTableSeg[] = []

    for (let rawSeg of rawSegs) {

      for (let resourceId in resourceIds) {
        let index = resourceIndex.indicesByPublicId[resourceId]

        if (index != null) {
          segs.push({
            row: rawSeg.row,
            firstCol: this.computeCol(rawSeg.firstCol, index),
            lastCol: this.computeCol(rawSeg.lastCol, index),
            isStart: rawSeg.isStart,
            isEnd: rawSeg.isEnd
          })
        }
      }
    }

    return segs
  }


  buildCells(): ResourceDayTableCell[][] {
    let { rowCnt, dayTable, resources } = this
    let rows: ResourceDayTableCell[][] = []

    for (let row = 0; row < rowCnt; row++) {
      let rowCells: ResourceDayTableCell[] = []

      for (let dateCol = 0; dateCol < dayTable.colCnt; dateCol++) {

        for (let resourceCol = 0; resourceCol < resources.length; resourceCol++) {
          let resource = resources[resourceCol]
          let htmlAttrs = resource.publicId ? 'data-resource-id="' + resource.publicId + '"' : ''

          rowCells[
            this.computeCol(dateCol, resourceCol)
          ] = {
            date: dayTable.cells[row][dateCol].date,
            resource,
            htmlAttrs
          }
        }
      }

      rows.push(rowCells)
    }

    return rows
  }

}


/*
resources over dates
*/
export class ResourceDayTable extends AbstractResourceDayTable {

  computeCol(dateI, resourceI) {
    return resourceI * this.dayTable.colCnt + dateI
  }

}


/*
dates over resources
*/
export class DayResourceTable extends AbstractResourceDayTable {

  computeCol(dateI, resourceI) {
    return dateI * this.resources.length + resourceI
  }

}


export class ResourceIndex {

  indicedByInternalId: { [resourceId: string]: number }
  indicesByPublicId: { [publicId: string]: number }
  publicIds: string[]
  length: number

  constructor(resources: Resource[]) {
    let indicedByInternalId = {}
    let indicesByPublicId = {}
    let publicIds = []

    for (let i = 0; i < resources.length; i++) {

      if (resources[i].publicId) {
        publicIds.push(resources[i].publicId)
        indicedByInternalId[resources[i].resourceId] = i
        indicesByPublicId[resources[i].publicId] = i
      }
    }

    this.publicIds = publicIds
    this.indicedByInternalId = indicedByInternalId
    this.indicesByPublicId = indicesByPublicId
    this.length = resources.length
  }

}
