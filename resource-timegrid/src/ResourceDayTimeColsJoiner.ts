import { TimeColsSeg } from '@fullcalendar/timegrid'
import { AbstractResourceDayTableModel, VResourceJoiner } from '@fullcalendar/resource-common'

export class ResourceDayTimeColsJoiner extends VResourceJoiner<TimeColsSeg> {
  transformSeg(seg: TimeColsSeg, resourceDayTable: AbstractResourceDayTableModel, resourceI: number) {
    return [
      {
        ...seg,
        col: resourceDayTable.computeCol(seg.col, resourceI),
      },
    ]
  }
}
