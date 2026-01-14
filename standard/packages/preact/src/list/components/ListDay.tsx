import { joinClassNames } from '../../util/html'
import { BaseComponent } from '../../component/BaseComponent'
import { buildDateStr } from '../../component-util/date-rendering'
import type { DateMarker, DateRange } from '@full-ui/headless-calendar'
import type { EventRangeProps } from '../../component-util/event-rendering'
import { generateClassName } from '../../component-util/rendering-misc'
import { getDateMeta } from '../../component-util/date-rendering'
import { getEventKey } from '../../component-util/event-rendering'
import { getEventRangeMeta } from '../../component-util/event-rendering'
import { memoize } from '../../util/memoize'
import { sortEventSegs } from '../../component-util/event-rendering'
import classNames from '../../internal-classnames'
import { ListDayHeader } from "./ListDayHeader"
import { ListEvent } from "./ListEvent"

export interface ListSeg {
  // view-sliced whole-day span
  slicedStart: DateMarker
  slicedEnd: DateMarker
  isStart: boolean
  isEnd: boolean

  dayIndex: number
}

export interface ListDayProps {
  key?: string | number | null
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
        className={generateClassName(options.listDayClass, {
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
          className={joinClassNames(
            generateClassName(options.listDayEventsClass, dateMeta),
            classNames.flexCol,
          )}
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
                isMirror={false}
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
