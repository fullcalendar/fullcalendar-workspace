import { Duration } from '@fullcalendar/core'
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
  watchWidth,
  compareNumbers,
  ScrollResponder,
} from '@fullcalendar/core/internal'
import { buildDayTableRenderRange } from '@fullcalendar/daygrid/internal'
import { createElement, createRef } from '@fullcalendar/core/preact'
import { SingleMonth } from './SingleMonth.js'

interface MultiMonthViewState {
  clientWidth?: number // just inside the scroller
  xGap?: number
  xPadding?: number
}

export class MultiMonthView extends DateComponent<ViewProps, MultiMonthViewState> {
  // memo
  private splitDateProfileByMonth = memoize(splitDateProfileByMonth)
  private buildMonthFormat = memoize(buildMonthFormat)

  // ref
  private rootElRef = createRef<HTMLDivElement>() // also the scroll container
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private unwatchWidth: () => void

  render() {
    const { context, props, state } = this
    const { options } = context

    const colCount = state.clientWidth == null
      ? 2
      : Math.min(
          options.multiMonthMaxColumns,
          Math.floor(
            (state.clientWidth - state.xPadding + state.xGap) /
            (options.multiMonthMinWidth + state.xGap)
          ),
        )

    const monthWidth = state.clientWidth == null
      ? '34%' // will expand. now small enough to be 1/3. for allowing gap
      : Math.floor( // exact values can cause expansion to other rows
          (state.clientWidth - state.xPadding - (state.xGap * (colCount - 1))) /
          colCount
        )

    const monthDateProfiles = this.splitDateProfileByMonth(
      context.dateProfileGenerator,
      props.dateProfile,
      context.dateEnv,
      options.fixedWeekCount,
      options.showNonCurrentDates,
    )

    const monthTitleFormat = this.buildMonthFormat(options.multiMonthTitleFormat, monthDateProfiles)
    const rootClassNames = [
      'fc-multimonth-view',
      (colCount === 1) ?
        'fc-multimonth-singlecol' :
        'fc-multimonth-multicol',
      getIsHeightAuto(options) ?
        '' :
        'fc-multimonth-scroll',
      'fc-border', // BAD to mix this with size-listening?
    ]

    return (
      <NowTimer unit="day">
        {(nowDate: DateMarker, todayRange: DateRange) => (
          <ViewContainer
            elRef={this.rootElRef}
            elClasses={rootClassNames}
            viewSpec={context.viewSpec}
          >
            <div ref={this.innerElRef} className='fc-multimonth-inner'>
              {monthDateProfiles.map((monthDateProfile, i) => {
                const monthStr = formatIsoMonthStr(monthDateProfile.currentRange.start)

                return (
                  <SingleMonth
                    {...props}
                    key={monthStr}
                    todayRange={todayRange}
                    isoDateStr={monthStr}
                    titleFormat={monthTitleFormat}
                    dateProfile={monthDateProfile}
                    width={monthWidth}
                  />
                )
              })}
            </div>
          </ViewContainer>
        )}
      </NowTimer>
    )
  }

  componentDidMount(): void {
    const { context } = this
    const { options } = context

    this.unwatchWidth = watchWidth(this.rootElRef.current, this.handleClientWidth)

    context.emitter.on('_timeScrollRequest', this.timeScrollResponder.handleScroll)
    this.timeScrollResponder.handleScroll(options.scrollTime)
  }

  componentDidUpdate(prevProps: ViewProps) {
    const { options } = this.context

    if (prevProps.dateProfile !== this.props.dateProfile && options.scrollTimeReset) {
      this.timeScrollResponder.handleScroll(options.scrollTime)
    } else {
      this.timeScrollResponder.drain()
    }
  }

  componentWillUnmount() {
    this.unwatchWidth()

    this.context.emitter.off('_timeScrollRequest', this.timeScrollResponder.handleScroll)
  }

  handleClientWidth = (clientWidth: number) => {
    let { xGap, xPadding } = this.state

    // for first time, assume 2 columns and query gap/padding
    if (xGap == null) {
      const innerEl = this.innerElRef.current
      const children = innerEl.childNodes

      if (children.length > 1) {
        const box0 = (children[0] as HTMLElement).getBoundingClientRect()
        const box1 = (children[1] as HTMLElement).getBoundingClientRect()
        let xSpan: number
        [xGap, xSpan] = [
          Math.abs(box0.left - box1.right),
          Math.abs(box0.right - box1.left),
        ].sort(compareNumbers)
        xPadding = clientWidth - xSpan
      }
    }

    this.setState({ clientWidth, xGap, xPadding })
  }

  private timeScrollResponder = new ScrollResponder((_time: Duration) => {
    // HACK to scroll to day

    if (this.state.clientWidth != null) {
      const { currentDate } = this.props.dateProfile
      const rootEl = this.rootElRef.current
      const innerEl = this.innerElRef.current
      const monthEl = innerEl.querySelector(`[data-date="${formatIsoMonthStr(currentDate)}"]`)

      rootEl.scrollTop = Math.ceil( // for fractions, err on the side of scrolling further
        monthEl.getBoundingClientRect().top -
        innerEl.getBoundingClientRect().top
      )
      return true
    }

    return false
  })
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
