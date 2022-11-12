import { TimeColsSeg } from '@fullcalendar/timegrid/internal'
import { AbstractResourceDayTableModel, VResourceJoiner } from '@fullcalendar/resource/internal'

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
