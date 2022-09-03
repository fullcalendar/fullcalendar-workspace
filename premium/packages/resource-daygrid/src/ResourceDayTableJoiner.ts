import { TableSeg } from '@fullcalendar/daygrid'
import { AbstractResourceDayTableModel, VResourceJoiner } from '@fullcalendar/resource-common'

export class ResourceDayTableJoiner extends VResourceJoiner<TableSeg> {
  transformSeg(seg: TableSeg, resourceDayTableModel: AbstractResourceDayTableModel, resourceI: number): TableSeg[] {
    let colRanges = resourceDayTableModel.computeColRanges(seg.firstCol, seg.lastCol, resourceI)

    return colRanges.map((colRange) => ({
      ...seg,
      ...colRange,
      isStart: seg.isStart && colRange.isStart,
      isEnd: seg.isEnd && colRange.isEnd,
    }))
  }
}
