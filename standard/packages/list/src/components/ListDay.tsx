import { afterSize, BaseComponent, buildDateStr, DateMarker, DateRange, EventRangeProps, getEventKey, getEventRangeMeta, memoize, RefMap, setRef, sortEventSegs } from "@fullcalendar/core/internal"
import { createElement, Ref } from '@fullcalendar/core/preact'
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
  timeWidthRef?: Ref<number>
  timeOuterWidth: number | undefined
}

export class ListDay extends BaseComponent<ListDayProps> {
  // memo
  private sortEventSegs = memoize(sortEventSegs)

  // ref
  private timeWidthRefMap = new RefMap<string, number>(() => {
    afterSize(this.handleTimeWidths)
  })

  render() {
    const { props, context, timeWidthRefMap } = this
    const { nowDate, todayRange } = props
    const { options } = context

    const segs = this.sortEventSegs(props.segs, options.eventOrder)
    const fullDateStr = buildDateStr(this.context, props.dayDate)

    return (
      <div
        role='listitem'
        aria-label={fullDateStr}
        className='fc-list-day-and-events'
      >
        <ListDayHeader
          dayDate={props.dayDate}
          todayRange={todayRange}
          forPrint={props.forPrint}
          fullDateStr={fullDateStr}
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
                timeWidthRef={timeWidthRefMap.createRef(key)}
                timeOuterWidth={props.timeOuterWidth}
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

  handleTimeWidths = () => {
    const timeWidthMap = this.timeWidthRefMap.current
    let max = 0


    for (const timeWidth of timeWidthMap.values()) {
      max = Math.max(max, timeWidth)
    }

    setRef(this.props.timeWidthRef, max)
  }

  componentWillUnmount(): void {
    setRef(this.props.timeWidthRef, null)
  }
}
