import { DayGridRange, EventRangeProps } from '@fullcalendar/preact/internal'
import { AbstractResourceDayTableModel } from '../resource/common/AbstractResourceDayTableModel'
import { VResourceJoiner } from '../resource/common/VResourceJoiner'

export class ResourceDayTableJoiner extends VResourceJoiner<DayGridRange> {
  transformSeg(
    seg: DayGridRange & EventRangeProps,
    resourceDayTableModel: AbstractResourceDayTableModel,
    resourceI: number,
  ): (DayGridRange & EventRangeProps)[] {
    let colRanges = resourceDayTableModel.computeColRanges(seg.start, seg.end, resourceI)

    return colRanges.map((colRange) => ({
      ...seg,
      ...colRange,
      isStart: seg.isStart && colRange.isStart,
      isEnd: seg.isEnd && colRange.isEnd,
    }))
  }
}
