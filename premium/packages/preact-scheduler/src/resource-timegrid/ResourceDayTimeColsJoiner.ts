import { TimeGridRange } from '@fullcalendar/preact/protected-api'
import { AbstractResourceDayTableModel, DateColIndex, ViewColIndex } from '../resource/common/AbstractResourceDayTableModel'
import { DateIndexedSeg, ViewIndexedSeg, VResourceJoiner } from '../resource/common/VResourceJoiner'

export class ResourceDayTimeColsJoiner extends VResourceJoiner<TimeGridRange> {
  transformSeg(
    seg: DateIndexedSeg<TimeGridRange>,
    resourceDayTable: AbstractResourceDayTableModel,
    resourceI: number,
  ): ViewIndexedSeg<TimeGridRange>[] {
    let dateI: DateColIndex = seg.col
    let col: ViewColIndex = resourceDayTable.computeCol(dateI, resourceI)

    if (col === -1) {
      return []
    }

    return [
      {
        ...seg,
        col,
      },
    ]
  }
}
