import { DayGridRange, EventRangeProps } from '@fullcalendar/preact/protected-api'
import { AbstractResourceDayTableModel } from '../resource/common/AbstractResourceDayTableModel'
import { VResourceJoiner } from '../resource/common/VResourceJoiner'

export class ResourceDayTableJoiner extends VResourceJoiner<DayGridRange> {
  transformSeg(
    seg: DayGridRange & EventRangeProps,
    resourceDayTableModel: AbstractResourceDayTableModel,
    resourceI: number,
    fallbackToPlaceholder: boolean,
  ): (DayGridRange & EventRangeProps)[] {
    let colRanges = resourceDayTableModel.computeColRanges(seg.start, seg.end, resourceI, fallbackToPlaceholder)

    return colRanges.map((colRange) => ({
      ...seg,
      ...colRange,
      isStart: seg.isStart && colRange.isStart,
      isEnd: seg.isEnd && colRange.isEnd,
    }))
  }
}
