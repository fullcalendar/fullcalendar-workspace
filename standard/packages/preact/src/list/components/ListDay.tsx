import { memo, useMemo } from 'react'
import { joinClassNames } from '../../util/html'
import { useViewContext } from '../../hooks/useViewContext'
import { buildDateStr } from '../../common/nav-link'
import type { DateMarker, DateRange } from '@full-ui/headless-calendar'
import type { EventRangeProps } from '../../component-util/event-rendering'
import { generateClassName } from '../../common/render-hook'
import { getDateMeta } from '../../component-util/date-rendering'
import { getEventRangeMeta } from '../../component-util/event-rendering'
import { sortEventSegs } from '../../component-util/event-rendering'
import classNames from '../../styles.module.css'
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
  dayDate: DateMarker
  nowDate: DateMarker
  nowMs?: number
  todayRange: DateRange
  segs: (ListSeg & EventRangeProps)[]
  isFirst: boolean
  isLast: boolean
  forPrint: boolean
}

export const ListDay = memo(function ListDay(props: ListDayProps) {
  const context = useViewContext()
  const { nowDate, todayRange } = props
  const { options, dateEnv } = context

  const dateMeta = useMemo(
    () => getDateMeta(props.dayDate, dateEnv, undefined, todayRange),
    [props.dayDate, dateEnv, todayRange],
  )
  const segs = useMemo(() => sortEventSegs(props.segs, options.eventOrder), [props.segs, options.eventOrder])
  const fullDateStr = buildDateStr(context, props.dayDate)
  const listDayData = {
    ...dateMeta,
    isFirst: props.isFirst,
    isLast: props.isLast,
    view: context.viewApi,
  }
  const listDayEventsData = {
    ...dateMeta,
    view: context.viewApi,
  }

  return (
    <div
      role='listitem'
      aria-label={fullDateStr}
      className={generateClassName(options.listDayClass, listDayData)}
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
          generateClassName(options.listDayBodyClass, listDayEventsData),
          classNames.flexCol,
        )}
      >
        {segs.map((seg, index) => {
          const key = seg.eventRange.instance.instanceId
          const isFirst = index === 0
          const isLast = index === segs.length - 1

          return (
            // unstyled list item wraps the event, so the event's own role (link, button) is preserved
            <div key={key} role='listitem' className={classNames.flexCol}>
              <ListEvent
                eventRange={seg.eventRange}
                slicedStart={seg.slicedStart}
                slicedEnd={seg.slicedEnd}
                isStart={seg.isStart}
                isEnd={seg.isEnd}
                isFirst={isFirst}
                isLast={isLast}
                isDragging={false}
                isResizing={false}
                isMirror={false}
                isSelected={false}
                {...getEventRangeMeta(seg.eventRange, todayRange, nowDate, props.nowMs)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
})
