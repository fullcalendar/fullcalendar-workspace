import { EventRenderRange, ViewApi } from '@fullcalendar/core'
import {
  addDays,
  afterSize,
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
  RefMap,
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
import { ListSeg, ListDay } from './ListDay.js'

export interface NoEventsContentArg {
  text: string
  view: ViewApi
}

export type NoEventsMountArg = MountArg<NoEventsContentArg>

export interface ListViewState {
  timeOuterWidth?: number
}

/*
Responsible for the scroller, and forwarding event-related actions into the "grid".
*/
export class ListView extends DateComponent<ViewProps, ListViewState> {
  // memo
  private computeDateVars = memoize(computeDateVars)
  private eventStoreToSegs = memoize(this._eventStoreToSegs)

  // ref
  private timeWidthRefMap = new RefMap<string, number>(() => {
    afterSize(this.handleTimeWidths)
  })

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
              const key = formatDayString(dayDate)

              dayNodes.push(
                <ListDay
                  key={key}
                  dayDate={dayDate}
                  nowDate={nowDate}
                  todayRange={todayRange}
                  segs={daySegs}
                  forPrint={this.props.forPrint}
                  timeWidthRef={this.timeWidthRefMap.createRef(key)}
                  timeOuterWidth={this.state.timeOuterWidth}
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

  handleTimeWidths = () => {
    const timeWidthMap = this.timeWidthRefMap.current
    let max = 0

    for (const timeWidth of timeWidthMap.values()) {
      max = Math.max(max, timeWidth)
    }

    this.setState({ timeOuterWidth: max })
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
