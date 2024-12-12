import { BaseComponent, DateMarker, DateRange, EventRangeProps, getEventKey, getEventRangeMeta, memoize, sortEventSegs } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { ListDayHeader } from "./ListDayHeader.js"
import { ListEvent } from "./ListEvent.js"

export interface ListSeg {
  startDate: DateMarker
  endDate: DateMarker
  isStart: boolean
  isEnd: boolean
  dayIndex: number
}

export interface ListDayProps {
  dayDate: DateMarker
  nowDate: DateMarker
  todayRange: DateRange
  segs: (ListSeg & EventRangeProps)[]
  forPrint: boolean
}

export class ListDay extends BaseComponent<ListDayProps> {
  sortEventSegs = memoize(sortEventSegs)

  render() {
    const { props, context } = this
    const { nowDate, todayRange } = props
    const { options } = context

    const segs = this.sortEventSegs(props.segs, options.eventOrder)

    return (
      <div className='fc-list-day-outer'>
        <ListDayHeader
          dayDate={props.dayDate}
          todayRange={todayRange}
          forPrint={props.forPrint}
        />
        {segs.map((seg) => (
          <ListEvent
            key={getEventKey(seg)}
            eventRange={seg.eventRange}
            isStart={seg.isStart}
            isEnd={seg.isEnd}
            segStart={seg.startDate}
            segEnd={seg.endDate}
            isDragging={false}
            isResizing={false}
            isDateSelecting={false}
            isSelected={false}
            {...getEventRangeMeta(seg.eventRange, todayRange, nowDate)}
          />
        ))}
      </div>
    )
  }
}
