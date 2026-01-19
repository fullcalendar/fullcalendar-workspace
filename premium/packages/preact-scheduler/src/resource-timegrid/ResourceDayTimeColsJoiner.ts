import { TimeGridRange } from '@fullcalendar/preact/protected-api'
import { EventRangeProps } from '@fullcalendar/preact/protected-api'
import { AbstractResourceDayTableModel } from '../resource/common/AbstractResourceDayTableModel'
import { VResourceJoiner } from '../resource/common/VResourceJoiner'

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
