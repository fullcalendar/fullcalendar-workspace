import { DayGridRange, EventRangeProps } from '@fullcalendar/core/internal'
import { AbstractResourceDayTableModel, VResourceJoiner } from '@fullcalendar/resource/internal'

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
