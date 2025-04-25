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
  generateClassName,
  getIsHeightAuto,
  intersectRanges,
  joinClassNames,
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
import { ListDay, ListSeg } from './ListDay.js'

export interface NoEventsContentArg {
  text: string
  view: ViewApi
}

export type NoEventsMountArg = MountArg<NoEventsContentArg>

/*
Responsible for the scroller, and forwarding event-related actions into the "grid".
*/
export class ListView extends DateComponent<ViewProps> {
  // memo
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
        viewSpec={context.viewSpec}
        className={joinClassNames('fcu-flex-col', props.className)}
        elRef={this.setRootEl}
        borderX={props.borderX}
        borderTop={props.borderTop}
        borderBottom={props.borderBottom}
      >
        <Scroller // TODO: don't need heavyweight component
          vertical={verticalScrolling}
          className={verticalScrolling ? 'fcu-liquid' : ''}
        >
          {this.renderSegList(eventSegs, dayDates)}
          {!eventSegs.length && this.renderEmptyMessage()}
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
        attrs={{
          role: 'status', // does a polite announcement
        }}
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
            className={generateClassName(options.noEventsInnerClassNames, renderProps)}
          />
        )}
      </ContentContainer>
    )
  }

  renderSegList(allSegs: (ListSeg & EventRangeProps)[], dayDates: DateMarker[]) {
    let segsByDay = groupSegsByDay(allSegs) // sparse array

    return (
      <div
        role='list'
        aria-labelledby={this.props.labelId}
        aria-label={this.props.labelStr}
      >
        <NowTimer unit="day">
          {(nowDate: DateMarker, todayRange: DateRange) => {
            const dayNodes: VNode[] = []

            for (let dayIndex = 0; dayIndex < segsByDay.length; dayIndex += 1) {
              let daySegs = segsByDay[dayIndex]

              if (daySegs) { // sparse array, so might be undefined
                const dayDate = dayDates[dayIndex]
                const key = formatDayString(dayDate)

                dayNodes.push(
                  <ListDay
                    key={key}
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
      </div>
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
        // HACKY to reference internal state...
        this.props.dateProfile.activeRange,
        this.context.options.nextDayThreshold, // activates all-day slicing
      ).fg,
      dayRanges,
    )
  }

  eventRangesToSegs(
    fullDayEventRanges: EventRenderRange[],
    dayRanges: DateRange[],
  ): (ListSeg & EventRangeProps)[] {
    let segs: (ListSeg & EventRangeProps)[] = []

    for (let fullDayEventRange of fullDayEventRanges) {
      segs.push(...this.eventRangeToSegs(fullDayEventRange, dayRanges))
    }

    return segs
  }

  eventRangeToSegs(
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
