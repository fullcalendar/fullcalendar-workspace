import { CssDimValue } from '@fullcalendar/core'
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
  afterSize,
  watchWidth,
  fracToCssDim,
} from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { buildDayTableRenderRange } from '@fullcalendar/daygrid/internal'
import { createElement, createRef } from '@fullcalendar/core/preact'
import { SingleMonth } from './SingleMonth.js'

interface MultiMonthViewState {
  innerWidth?: number
}

export class MultiMonthView extends DateComponent<ViewProps, MultiMonthViewState> {
  // memo
  private splitDateProfileByMonth = memoize(splitDateProfileByMonth)
  private buildMonthFormat = memoize(buildMonthFormat)

  // ref
  private scrollerRef = createRef<Scroller>()
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerWidth?: () => void
  private scrollDate: DateMarker | null = null

  render() {
    const { context, props, state } = this
    const { options } = context
    const verticalScrolling = !props.forPrint && !getIsHeightAuto(options)

    const monthDateProfiles = this.splitDateProfileByMonth(
      context.dateProfileGenerator,
      props.dateProfile,
      context.dateEnv,
      options.fixedWeekCount,
      options.showNonCurrentDates,
    )

    const monthTitleFormat = this.buildMonthFormat(options.singleMonthTitleFormat, monthDateProfiles)

    const { multiMonthMaxColumns, singleMonthMinWidth } = options
    const { innerWidth } = state

    let cols: number | undefined
    let cssMonthWidth: CssDimValue | undefined
    let hasLateralSiblings = false

    if (innerWidth != null) {
      cols = Math.max(
        1,
        Math.min(
          multiMonthMaxColumns,
          Math.floor(innerWidth / singleMonthMinWidth),
        ),
      )

      if (props.forPrint) {
        cols = Math.min(cols, 2)
      }

      cssMonthWidth = fracToCssDim(1 / cols)
      hasLateralSiblings = cols > 1
    }

    return (
      <NowTimer unit="day">
        {(nowDate: DateMarker, todayRange: DateRange) => (
          <ViewContainer
            viewSpec={context.viewSpec}
            className={joinClassNames(
              // HACK for Safari. Can't do break-inside:avoid with flexbox items, likely b/c it's not standard:
              // https://stackoverflow.com/a/60256345
              !props.forPrint && classNames.flexCol,
              props.className,
            )}
            borderlessX={props.borderlessX}
            borderlessTop={props.borderlessTop}
            borderlessBottom={props.borderlessBottom}
            noEdgeEffects={props.noEdgeEffects}
          >
            <Scroller
              vertical={verticalScrolling}
              className={verticalScrolling ? classNames.liquid : ''}
              ref={this.scrollerRef}
            >
              <div
                role='list'
                aria-labelledby={props.labelId}
                aria-label={props.labelStr}
                className={classNames.safeTiles}
                ref={this.innerElRef}
              >
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
                      width={cssMonthWidth}
                      colCount={cols}
                      // when single-col, kill X border on all items
                      borderlessX={cols === 1}
                      // when single-col, kill top border on all items
                      borderlessTop={cols === 1}
                      // when single-col, kill bottom border on last item
                      borderlessBottom={cols === 1 && i === monthDateProfiles.length - 1}
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
    this.scrollerRef.current.addScrollEndListener(this.handleScrollEnd)

    this.disconnectInnerWidth = watchWidth(this.innerElRef.current, (innerWidth: number) => {
      afterSize(() => {
        this.setState({ innerWidth })
      })
    })
  }

  componentDidUpdate(prevProps: ViewProps) {
    if (prevProps.dateProfile !== this.props.dateProfile && this.context.options.scrollTimeReset) {
      this.resetScroll()
    } else {
      // NOT optimal to update so often
      // TODO: isolate dependencies of scroll coordinate
      this.applyScroll()
    }
  }

  componentWillUnmount() {
    this.scrollerRef.current.removeScrollEndListener(this.handleScrollEnd)

    this.disconnectInnerWidth()
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  private resetScroll() {
    this.scrollDate = this.props.dateProfile.currentDate
    this.applyScroll()
  }

  private applyScroll() {
    if (
      this.scrollDate != null &&
      this.state.innerWidth != null // render completed?
    ) {
      const scroller = this.scrollerRef.current
      const innerEl = this.innerElRef.current
      const monthEl = innerEl.querySelector(`[data-date="${formatIsoMonthStr(this.scrollDate)}"]`)
      const scrollTop = Math.ceil( // for fractions, err on the side of scrolling further
        (monthEl.parentNode as HTMLElement).getBoundingClientRect().top -
        innerEl.getBoundingClientRect().top
      )

      scroller.scrollTo({ y: scrollTop })
    }
  }

  private handleScrollEnd = (isUser: boolean) => {
    if (isUser) {
      this.scrollDate = null
    }
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
