import {
  DateComponent,
  ViewProps,
  ViewContainer,
  DateProfile,
  intersectRanges,
  DateMarker,
  DateEnv,
  createDuration,
  memoize,
  DateFormatter,
  createFormatter,
  DateProfileGenerator,
  formatIsoMonthStr,
  DateRange,
  NowTimer,
  getIsHeightAuto,
  Scroller,
  joinClassNames,
  RefMap,
  afterSize,
  watchWidth,
} from '@fullcalendar/core/internal'
import { buildDayTableRenderRange } from '@fullcalendar/daygrid/internal'
import { createElement, createRef } from '@fullcalendar/core/preact'
import { SingleMonth } from './SingleMonth.js'

interface MultiMonthViewState {
  scrollerInnerWidth?: number
  maxScrollbarWidth: number
  maxInnerGap: number // TODO: rename to inner-padding or something
  maxMonthGap: number
}

export class MultiMonthView extends DateComponent<ViewProps, MultiMonthViewState> {
  // memo
  private splitDateProfileByMonth = memoize(splitDateProfileByMonth)
  private buildMonthFormat = memoize(buildMonthFormat)

  // ref
  private scrollerRef = createRef<Scroller>()
  private innerElRef = createRef<HTMLDivElement>()
  private clientWidth?: number
  private scrollbarWidth?: number
  private innerWidth?: number // of the fc-multimonth-inner div
  private monthWidthMap = new RefMap<string, number>(() => {
    afterSize(this.handleWidths)
  })

  // internal
  private monthDateProfiles: DateProfile[]
  private cols: number = 2
  private disconnectInnerWidth?: () => void
  private scrollDate: DateMarker | null = null

  state: MultiMonthViewState = {
    maxScrollbarWidth: 0,
    maxInnerGap: 0,
    maxMonthGap: 0,
  }

  render() {
    const { context, props, state, monthWidthMap } = this
    const { options } = context
    const verticalScrolling = !props.forPrint && !getIsHeightAuto(options)

    const monthDateProfiles = this.monthDateProfiles = this.splitDateProfileByMonth(
      context.dateProfileGenerator,
      props.dateProfile,
      context.dateEnv,
      options.fixedWeekCount,
      options.showNonCurrentDates,
    )

    const monthTitleFormat = this.buildMonthFormat(options.multiMonthTitleFormat, monthDateProfiles)

    const { multiMonthMinWidth, multiMonthMaxColumns } = options
    let computedMonthWidth: number | undefined

    if (state.scrollerInnerWidth != null) {
      const availableWidth = state.scrollerInnerWidth - // space within border
        (state.maxScrollbarWidth + state.maxInnerGap) // subtract largest-case scenarios

      let cols = Math.max(
        1,
        Math.min(
          multiMonthMaxColumns,
          Math.floor((availableWidth + state.maxMonthGap) / (multiMonthMinWidth + state.maxInnerGap)),
        ),
      )

      if (props.forPrint) {
        cols = Math.min(cols, 2)
      }

      this.cols = cols
      computedMonthWidth = (availableWidth + state.maxMonthGap) / cols - state.maxMonthGap
    }

    // gap is unknown, so make it basis as small as possible without causing the next # of columns
    // after basis, each month will expand in width
    const monthBasis = Math.round((1 / (this.cols + 1)) * 100) + 1 + '%'

    const hasLateralSiblings = this.cols > 1

    return (
      <NowTimer unit="day">
        {(nowDate: DateMarker, todayRange: DateRange) => (
          <ViewContainer
            className={joinClassNames(
              'fc-multimonth',
              (this.cols === 1) ?
                'fc-multimonth-singlecol' :
                'fc-multimonth-multicol',
              'fc-border fc-flex-col',
            )}
            viewSpec={context.viewSpec}
          >
            <Scroller
              vertical={verticalScrolling}
              className={verticalScrolling ? 'fc-liquid' : ''}
              ref={this.scrollerRef}
              clientWidthRef={this.handleClientWidth}
              endScrollbarWidthRef={this.handleEndScrollbarWidth}
            >
              <div ref={this.innerElRef} className='fc-multimonth-inner'>
                {monthDateProfiles.map((monthDateProfile) => {
                  const monthStr = formatIsoMonthStr(monthDateProfile.currentRange.start)

                  return (
                    <SingleMonth
                      {...props}
                      key={monthStr}
                      todayRange={todayRange}
                      isoDateStr={monthStr}
                      titleFormat={monthTitleFormat}
                      dateProfile={monthDateProfile}
                      flexBasis={monthBasis}
                      widthRef={monthWidthMap.createRef(monthStr)}
                      visibleWidth={computedMonthWidth}
                      hasLateralSiblings={hasLateralSiblings}
                    />
                  )
                })}
              </div>
            </Scroller>
          </ViewContainer>
        )}
      </NowTimer>
    )
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount(): void {
    this.resetScroll()
    this.scrollerRef.current.addScrollEndListener(this.clearScroll)

    this.disconnectInnerWidth = watchWidth(this.innerElRef.current, (innerWidth: number) => {
      this.innerWidth = innerWidth
      afterSize(this.handleWidths)
    })
  }

  componentDidUpdate(prevProps: ViewProps) {
    if (prevProps.dateProfile !== this.props.dateProfile && this.context.options.scrollTimeReset) {
      this.resetScroll()
    } else {
      // NOT optimal to update so often
      // TODO: isolate dependencies of scroll coordinate
      this.updateScroll()
    }
  }

  componentWillUnmount() {
    this.scrollerRef.current.removeScrollEndListener(this.clearScroll)

    this.disconnectInnerWidth()
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  handleClientWidth = (clientWidth: number) => {
    this.clientWidth = clientWidth
    afterSize(this.handleWidths)
  }

  handleEndScrollbarWidth = (scrollbarWidth: number) => {
    this.scrollbarWidth = scrollbarWidth
    afterSize(this.handleWidths)
  }

  handleWidths = () => {
    const measuredMonthWidth = this.monthWidthMap.current.get( // first month
      formatIsoMonthStr(this.monthDateProfiles[0].currentRange.start)
    )

    if (measuredMonthWidth != null) { // somehow this is undefined when switching years
      const { state, cols, clientWidth, scrollbarWidth, innerWidth } = this
      const innerGap = clientWidth - innerWidth

      const monthGap = cols > 1
        ? (innerWidth - measuredMonthWidth * cols) / (cols - 1)
        : 0

      this.setState({
        scrollerInnerWidth: clientWidth + scrollbarWidth,
        maxScrollbarWidth: Math.max(state.maxScrollbarWidth, scrollbarWidth),
        maxInnerGap: Math.max(state.maxInnerGap, innerGap),
        maxMonthGap: Math.max(state.maxMonthGap, monthGap),
      })
    }
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  private resetScroll() {
    this.scrollDate = this.props.dateProfile.currentDate
    this.updateScroll()
  }

  private updateScroll = () => {
    if (this.scrollDate != null && this.clientWidth != null) {
      const scroller = this.scrollerRef.current
      const innerEl = this.innerElRef.current
      const monthEl = innerEl.querySelector(`[data-date="${formatIsoMonthStr(this.scrollDate)}"]`)
      const scrollTop = Math.ceil( // for fractions, err on the side of scrolling further
        monthEl.getBoundingClientRect().top -
        innerEl.getBoundingClientRect().top
      )

      scroller.scrollTo({ y: scrollTop })
    }
  }

  private clearScroll = () => {
    this.scrollDate = null
  }
}

// date profile
// -------------------------------------------------------------------------------------------------

const oneMonthDuration = createDuration(1, 'month')

function splitDateProfileByMonth(
  dateProfileGenerator: DateProfileGenerator,
  dateProfile: DateProfile,
  dateEnv: DateEnv,
  fixedWeekCount?: boolean,
  showNonCurrentDates?: boolean,
): DateProfile[] {
  const { start, end } = dateProfile.currentRange
  let monthStart: DateMarker = start
  const monthDateProfiles: DateProfile[] = []

  while (monthStart.valueOf() < end.valueOf()) {
    const monthEnd = dateEnv.add(monthStart, oneMonthDuration)
    const currentRange = {
      // yuck
      start: dateProfileGenerator.skipHiddenDays(monthStart),
      end: dateProfileGenerator.skipHiddenDays(monthEnd, -1, true),
    }
    let renderRange = buildDayTableRenderRange({
      currentRange,
      snapToWeek: true,
      fixedWeekCount,
      dateEnv,
    })
    renderRange = {
      // yuck
      start: dateProfileGenerator.skipHiddenDays(renderRange.start),
      end: dateProfileGenerator.skipHiddenDays(renderRange.end, -1, true),
    }
    const activeRange = dateProfile.activeRange ?
      intersectRanges(
        dateProfile.activeRange,
        showNonCurrentDates ? renderRange : currentRange,
      ) :
      null

    monthDateProfiles.push({
      currentDate: dateProfile.currentDate,
      isValid: dateProfile.isValid,
      validRange: dateProfile.validRange,
      renderRange,
      activeRange,
      currentRange,
      currentRangeUnit: 'month',
      isRangeAllDay: true,
      dateIncrement: dateProfile.dateIncrement,
      slotMinTime: dateProfile.slotMaxTime,
      slotMaxTime: dateProfile.slotMinTime,
    })

    monthStart = monthEnd
  }

  return monthDateProfiles
}

// date formatting
// -------------------------------------------------------------------------------------------------

const YEAR_MONTH_FORMATTER = createFormatter({ year: 'numeric', month: 'long' })
const YEAR_FORMATTER = createFormatter({ month: 'long' })

function buildMonthFormat(
  formatOverride: DateFormatter | undefined,
  monthDateProfiles: DateProfile[],
): DateFormatter {
  return formatOverride ||
    ((monthDateProfiles[0].currentRange.start.getUTCFullYear() !==
      monthDateProfiles[monthDateProfiles.length - 1].currentRange.start.getUTCFullYear())
      ? YEAR_MONTH_FORMATTER
      : YEAR_FORMATTER)
}
