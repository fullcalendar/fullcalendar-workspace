import { TimeGridRange } from '@fullcalendar/preact/protected-api'
import { EventRangeProps } from '@fullcalendar/preact/protected-api'
import { AbstractResourceDayTableModel } from '../resource/common/AbstractResourceDayTableModel'
import { VResourceJoiner } from '../resource/common/VResourceJoiner'

export class ResourceDayTimeColsJoiner extends VResourceJoiner<TimeGridRange> {
  transformSeg(
    seg: TimeGridRange & EventRangeProps,
    resourceDayTable: AbstractResourceDayTableModel,
    resourceI: number,
    fallbackToPlaceholder: boolean,
  ): (TimeGridRange & EventRangeProps)[] {
    let col = resourceDayTable.computeCol(seg.col, resourceI)

    if (col === -1 && fallbackToPlaceholder) {
      col = resourceDayTable.computeCol(seg.col, -1)
    }

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
