import { DayGridRange } from '@fullcalendar/preact/protected-api'
import { AbstractResourceDayTableModel, DateColIndex } from '../resource/common/AbstractResourceDayTableModel'
import { DateIndexedSeg, ViewIndexedSeg, VResourceJoiner } from '../resource/common/VResourceJoiner'

export class ResourceDayTableJoiner extends VResourceJoiner<DayGridRange> {
  transformSeg(
    seg: DateIndexedSeg<DayGridRange>,
    resourceDayTableModel: AbstractResourceDayTableModel,
    resourceI: number,
    fallbackToPlaceholder: boolean,
  ): ViewIndexedSeg<DayGridRange>[] {
    let dateStartI: DateColIndex = seg.start
    let dateEndI: DateColIndex = seg.end
    let colRanges = resourceDayTableModel.computeColRanges(dateStartI, dateEndI, resourceI, fallbackToPlaceholder)

    return colRanges.map((colRange) => ({
      ...seg,
      ...colRange,
      isStart: seg.isStart && colRange.isStart,
      isEnd: seg.isEnd && colRange.isEnd,
    }))
  }
}
