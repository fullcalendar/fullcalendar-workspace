import { TimeGridRange } from '@fullcalendar/timegrid/internal'
import { AbstractResourceDayTableModel, VResourceJoiner } from '@fullcalendar/resource/internal'
import { EventRangeProps } from '@fullcalendar/core/internal'

export class ResourceDayTimeColsJoiner extends VResourceJoiner<TimeGridRange> {
  transformSeg(
    seg: TimeGridRange & EventRangeProps,
    resourceDayTable: AbstractResourceDayTableModel,
    resourceI: number,
  ): (TimeGridRange & EventRangeProps)[] {
    return [
      {
        ...seg,
        col: resourceDayTable.computeCol(seg.col, resourceI),
      },
    ]
  }
}
