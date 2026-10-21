import type { EventRenderRange } from '../../event-segs/event-ranges'
import { ViewApi } from '../../api/ViewApi'
import { joinClassNames } from '../../util/html'
import { addDays } from '@full-ui/headless-calendar'
import { CustomContent } from '../../render-hook/CustomContent'
import { useViewContext } from '../../context/useViewContext'
import { useRenderHookEl } from '../../render-hook/useRenderHookEl'
import { createViewComponent } from '../../views/view-config'
import { useHitTarget } from '../../interactions/useHitTarget'
import { useNow } from '../../now/useNow'
import type { DateMarker, DateRange } from '@full-ui/headless-calendar'
import type { DateProfile } from '../../date-profile/DateProfileGenerator'
import type { EventRangeProps } from '../../event-segs/event-ranges'
import { formatDayString } from '@full-ui/headless-calendar'
import { generateClassName } from '../../render-hook/render-hook-types'
import { getIsHeightAuto } from '../../scrollgrid/util'
import { intersectRanges } from '@full-ui/headless-calendar'
import { Scroller } from '../../scrollgrid/Scroller'
import { sliceEventStore } from '../../event-segs/event-ranges'
import { startOfDay } from '@full-ui/headless-calendar'
import { ViewContainer } from '../../views/ViewContainer'
import type { ViewProps } from '../../views/view-props'
import classNames from '../../styles.module.css'
import { useMemo, useRef, type ReactNode, type ReactElement } from 'react'
import { ListDay, ListSeg } from './ListDay'

export interface NoEventsInfo {
  text: string
  view: ViewApi
}

// memoized on its props, and marked as a view (see createViewComponent)
export const ListView = createViewComponent(ListViewBody)

/*
Responsible for the scroller, and forwarding event-related actions into the "grid".
*/
function ListViewBody(props: ViewProps) {
  const context = useViewContext()
  const { options } = context
  const rootElRef = useRef<HTMLElement | null>(null)

  useHitTarget(rootElRef, {
    disableHits: true, // HACK to not do date-clicking/selecting
    eventSelection: props.eventSelection,
    eventDrag: props.eventDrag,
    eventResize: props.eventResize,
  })

  const { dayDates, dayRanges } = useMemo(() => computeDateVars(props.dateProfile), [props.dateProfile])
  const { activeRange } = props.dateProfile
  const eventSegs = useMemo(
    () => eventRangesToSegs(
      sliceEventStore(
        props.eventStore,
        props.eventUiBases,
        activeRange,
        options.nextDayThreshold, // activates all-day slicing
      ).fg,
      dayRanges,
    ),
    [props.eventStore, props.eventUiBases, dayRanges, activeRange, options.nextDayThreshold],
  )
  const verticalScrolling = !props.forPrint && !getIsHeightAuto(options)

  return (
    <ViewContainer
      viewSpec={context.viewSpec}
      className={joinClassNames(props.className, classNames.flexCol)}
      elRef={rootElRef}
    >
      {eventSegs.length ? (
        <Scroller // TODO: don't need heavyweight component
          vertical={verticalScrolling}
          className={joinClassNames(
            classNames.flexCol,
            verticalScrolling ? classNames.liquid : '',
          )}
        >
          <div
            role="list"
            aria-labelledby={props.labelId}
            aria-label={props.labelStr}
            className={joinClassNames(
              classNames.flexCol,
              joinClassNames(options.listDaysClass),
            )}
          >
            <ListDays
              segs={eventSegs}
              dayDates={dayDates}
              forPrint={props.forPrint}
            />
          </div>
        </Scroller>
      ) : <ListNoEvents />}

    </ViewContainer>
  )
}

/*
The days with events. Its own component so that only it re-renders when the day changes
*/
function ListDays(props: { segs: (ListSeg & EventRangeProps)[], dayDates: DateMarker[], forPrint: boolean }) {
  const { nowDate, nowMs, todayRange } = useNow('day')
  const segsByDay = groupSegsByDay(props.segs) // sparse array
  const dayNodes: ReactElement[] = []
  const populatedDayCount = segsByDay.reduce(
    (count, daySegs) => count + (daySegs ? 1 : 0),
    0,
  )
  let populatedDayIndex = 0

  for (let dayIndex = 0; dayIndex < segsByDay.length; dayIndex += 1) {
    let daySegs = segsByDay[dayIndex]

    if (daySegs) { // sparse array, so might be undefined
      const dayDate = props.dayDates[dayIndex]
      const key = formatDayString(dayDate)
      const isFirst = populatedDayIndex === 0
      const isLast = populatedDayIndex === populatedDayCount - 1

      dayNodes.push(
        <ListDay
          key={key}
          dayDate={dayDate}
          nowDate={nowDate}
          nowMs={nowMs}
          todayRange={todayRange}
          segs={daySegs}
          isFirst={isFirst}
          isLast={isLast}
          forPrint={props.forPrint}
        />,
      )

      populatedDayIndex += 1
    }
  }

  return (
    <>{dayNodes}</>
  )
}

function eventRangesToSegs(
  fullDayEventRanges: EventRenderRange[],
  dayRanges: DateRange[],
): (ListSeg & EventRangeProps)[] {
  let segs: (ListSeg & EventRangeProps)[] = []

  for (let fullDayEventRange of fullDayEventRanges) {
    segs.push(...eventRangeToSegs(fullDayEventRange, dayRanges))
  }

  return segs
}

function eventRangeToSegs(
  fullDayEventRange: EventRenderRange,
  dayRanges: DateRange[],
): (ListSeg & EventRangeProps)[] {
  let fullDayRange = fullDayEventRange.range
  let dayIndex: number
  let segs: (ListSeg & EventRangeProps)[] = []

  for (dayIndex = 0; dayIndex < dayRanges.length; dayIndex += 1) {
    const slicedFullDayRange = intersectRanges(fullDayRange, dayRanges[dayIndex])

    if (slicedFullDayRange) {
      segs.push({
        eventRange: fullDayEventRange,
        slicedStart: slicedFullDayRange.start,
        slicedEnd: slicedFullDayRange.end,
        isStart: fullDayEventRange.isStart && fullDayRange.start.valueOf() === slicedFullDayRange.start.valueOf(),
        isEnd: fullDayEventRange.isEnd && fullDayRange.end.valueOf() === slicedFullDayRange.end.valueOf(),
        dayIndex,
      })
    }
  }

  return segs
}

// the message when there are no events, with its noEvents* render hooks
function ListNoEvents() {
  let { options, viewApi } = useViewContext()
  let renderProps: NoEventsInfo = {
    text: options.noEventsText,
    view: viewApi,
  }
  let renderHookEl = useRenderHookEl({
    classGenerator: options.noEventsClass,
    didMount: options.noEventsDidMount,
    willUnmount: options.noEventsWillUnmount,
    renderProps,
  })

  return (
    <div
      role='status' // does a polite announcement
      ref={renderHookEl.ref}
      className={joinClassNames(renderHookEl.className, classNames.grow)}
    >
      <CustomContent
        tag="div"
        className={generateClassName(options.noEventsInnerClass, renderProps)}
        renderProps={renderProps}
        generatorName="noEventsContent"
        generator={options.noEventsContent}
        fallback={renderNoEventsInner}
      />
    </div>
  )
}

function renderNoEventsInner(renderProps: NoEventsInfo): ReactNode {
  return renderProps.text
}

function computeDateVars(dateProfile: DateProfile) {
  let dayStart = startOfDay(dateProfile.renderRange.start)
  let viewEnd = dateProfile.renderRange.end
  let dayDates: DateMarker[] = []
  let dayRanges: DateRange[] = []

  while (dayStart < viewEnd) {
    dayDates.push(dayStart)

    dayRanges.push({
      start: dayStart,
      end: addDays(dayStart, 1),
    })

    dayStart = addDays(dayStart, 1)
  }

  return { dayDates, dayRanges }
}

// Returns a sparse array of arrays, segs grouped by their dayIndex
function groupSegsByDay(
  segs: (ListSeg & EventRangeProps)[],
): (ListSeg & EventRangeProps)[][] {
  let segsByDay: (ListSeg & EventRangeProps)[][] = [] // sparse array
  let i: number
  let seg: ListSeg & EventRangeProps

  for (i = 0; i < segs.length; i += 1) {
    seg = segs[i];
    (segsByDay[seg.dayIndex] || (segsByDay[seg.dayIndex] = []))
      .push(seg)
  }

  return segsByDay
}
