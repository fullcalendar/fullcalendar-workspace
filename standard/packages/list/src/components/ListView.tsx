import { EventRenderRange, ViewApi } from '@fullcalendar/core'
import {
  addDays,
  ContentContainer,
  DateComponent,
  DateMarker,
  DateProfile,
  DateRange,
  EventRangeProps,
  EventStore,
  EventUiHash,
  formatDayString,
  getIsHeightAuto,
  intersectRanges,
  memoize,
  MountArg,
  NowTimer,
  Scroller,
  sliceEventStore,
  startOfDay,
  ViewContainer,
  ViewProps
} from '@fullcalendar/core/internal'
import {
  ComponentChild,
  createElement,
  Fragment,
  VNode,
} from '@fullcalendar/core/preact'
import { ListDay } from './ListDay.js'

export interface NoEventsContentArg {
  text: string
  view: ViewApi
}

export interface ListSeg {
  startDate: DateMarker
  endDate: DateMarker
  isStart: boolean
  isEnd: boolean
  dayIndex: number
}

export type NoEventsMountArg = MountArg<NoEventsContentArg>

/*
Responsible for the scroller, and forwarding event-related actions into the "grid".
*/
export class ListView extends DateComponent<ViewProps> {
  private computeDateVars = memoize(computeDateVars)
  private eventStoreToSegs = memoize(this._eventStoreToSegs)

  render() {
    let { props, context } = this
    let { options } = context

    let { dayDates, dayRanges } = this.computeDateVars(props.dateProfile)
    let eventSegs = this.eventStoreToSegs(props.eventStore, props.eventUiBases, dayRanges)
    let verticalScrolling = !props.forPrint && !getIsHeightAuto(options)

    return (
      <ViewContainer
        elRef={this.setRootEl}
        className='fc-list fc-flex-col fc-border'
        viewSpec={context.viewSpec}
      >
        <Scroller // TODO: don't need heavyweight component
          vertical={verticalScrolling}
          className={verticalScrolling ? 'fc-liquid' : ''}
        >
          {eventSegs.length > 0 ?
            this.renderSegList(eventSegs, dayDates) :
            this.renderEmptyMessage()}
        </Scroller>
      </ViewContainer>
    )
  }

  setRootEl = (rootEl: HTMLElement | null) => {
    if (rootEl) {
      this.context.registerInteractiveComponent(this, {
        el: rootEl,
        disableHits: true, // HACK to not do date-clicking/selecting
      })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  renderEmptyMessage() {
    let { options, viewApi } = this.context
    let renderProps: NoEventsContentArg = {
      text: options.noEventsText,
      view: viewApi,
    }

    return (
      <ContentContainer
        tag="div"
        className='fc-list-empty'
        renderProps={renderProps}
        generatorName="noEventsContent"
        customGenerator={options.noEventsContent}
        defaultGenerator={renderNoEventsInner}
        classNameGenerator={options.noEventsClassNames}
        didMount={options.noEventsDidMount}
        willUnmount={options.noEventsWillUnmount}
      >
        {(InnerContent) => (
          <InnerContent
            tag="div"
            className='fc-list-empty-inner'
          />
        )}
      </ContentContainer>
    )
  }

  renderSegList(allSegs: (ListSeg & EventRangeProps)[], dayDates: DateMarker[]) {
    let segsByDay = groupSegsByDay(allSegs) // sparse array

    return (
      <NowTimer unit="day">
        {(nowDate: DateMarker, todayRange: DateRange) => {
          const dayNodes: VNode[] = []

          for (let dayIndex = 0; dayIndex < segsByDay.length; dayIndex += 1) {
            let daySegs = segsByDay[dayIndex]

            if (daySegs) { // sparse array, so might be undefined
              const dayDate = dayDates[dayIndex]

              dayNodes.push(
                <ListDay
                  key={formatDayString(dayDate)}
                  dayDate={dayDate}
                  nowDate={nowDate}
                  todayRange={todayRange}
                  segs={daySegs}
                  forPrint={this.props.forPrint}
                />
              )
            }
          }

          return (
            <Fragment>{dayNodes}</Fragment>
          )
        }}
      </NowTimer>
    )
  }

  _eventStoreToSegs(
    eventStore: EventStore,
    eventUiBases: EventUiHash,
    dayRanges: DateRange[],
  ): (ListSeg & EventRangeProps)[] {
    return this.eventRangesToSegs(
      sliceEventStore(
        eventStore,
        eventUiBases,
        this.props.dateProfile.activeRange, // HACKY
        this.context.options.nextDayThreshold, // HACKY
      ).fg,
      dayRanges,
    )
  }

  eventRangesToSegs(
    eventRanges: EventRenderRange[],
    dayRanges: DateRange[],
  ): (ListSeg & EventRangeProps)[] {
    let segs: (ListSeg & EventRangeProps)[] = []

    for (let eventRange of eventRanges) {
      segs.push(...this.eventRangeToSegs(eventRange, dayRanges))
    }

    return segs
  }

  eventRangeToSegs(
    eventRange: EventRenderRange,
    dayRanges: DateRange[],
  ): (ListSeg & EventRangeProps)[] {
    let { dateEnv } = this.context
    let { nextDayThreshold } = this.context.options
    let range = eventRange.range
    let allDay = eventRange.def.allDay
    let dayIndex
    let segRange
    let seg: ListSeg & EventRangeProps
    let segs: (ListSeg & EventRangeProps)[] = []

    for (dayIndex = 0; dayIndex < dayRanges.length; dayIndex += 1) {
      segRange = intersectRanges(range, dayRanges[dayIndex])

      if (segRange) {
        seg = {
          eventRange,
          startDate: segRange.start,
          endDate: segRange.end,
          isStart: eventRange.isStart && segRange.start.valueOf() === range.start.valueOf(),
          isEnd: eventRange.isEnd && segRange.end.valueOf() === range.end.valueOf(),
          dayIndex,
        }

        segs.push(seg)

        // detect when range won't go fully into the next day,
        // and mutate the latest seg to the be the end.
        if (
          !seg.isEnd && !allDay &&
          dayIndex + 1 < dayRanges.length &&
          range.end <
            dateEnv.add(
              dayRanges[dayIndex + 1].start,
              nextDayThreshold,
            )
        ) {
          seg.endDate = range.end
          seg.isEnd = true
          break
        }
      }
    }

    return segs
  }
}

function renderNoEventsInner(renderProps: NoEventsContentArg): ComponentChild {
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
  segs: (ListSeg & EventRangeProps)[]
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
