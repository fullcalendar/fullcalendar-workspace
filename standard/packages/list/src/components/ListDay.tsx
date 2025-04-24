import { BaseComponent, buildDateStr, DateMarker, DateRange, EventRangeProps, generateClassName, getDateMeta, getEventKey, getEventRangeMeta, memoize, sortEventSegs } from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { ListDayHeader } from "./ListDayHeader.js"
import { ListEvent } from "./ListEvent.js"

export interface ListSeg {
  // view-sliced whole-day span
  slicedStart: DateMarker
  slicedEnd: DateMarker
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
  // memo
  private getDateMeta = memoize(getDateMeta)
  private sortEventSegs = memoize(sortEventSegs)

  render() {
    const { props, context } = this
    const { nowDate, todayRange } = props
    const { options } = context

    const dateMeta = this.getDateMeta(props.dayDate, context.dateEnv, undefined, todayRange)
    const segs = this.sortEventSegs(props.segs, options.eventOrder)
    const fullDateStr = buildDateStr(this.context, props.dayDate)

    return (
      <div
        role='listitem'
        aria-label={fullDateStr}
        className={generateClassName(options.listDayClassName, {
          ...dateMeta,
          view: context.viewApi,
        })}
      >
        <ListDayHeader
          dayDate={props.dayDate}
          dateMeta={dateMeta}
          forPrint={props.forPrint}
        />
        <div
          role='list'
          aria-label={options.eventsHint}
        >
          {segs.map((seg) => {
            const key = getEventKey(seg)

            return (
              <ListEvent
                key={key}
                eventRange={seg.eventRange}
                slicedStart={seg.slicedStart}
                slicedEnd={seg.slicedEnd}
                isStart={seg.isStart}
                isEnd={seg.isEnd}
                isDragging={false}
                isResizing={false}
                isDateSelecting={false}
                isSelected={false}
                {...getEventRangeMeta(seg.eventRange, todayRange, nowDate)}
              />
            )
          })}
        </div>
      </div>
    )
  }
}
