import { CssDimValue } from '../../scrollgrid/util'
import { joinClassNames } from '../../util/html'
import { DateComponent } from '../../component/DateComponent'
import { ViewProps } from '../../component-util/View'
import { ViewContainer } from '../../common/ViewContainer'
import { DateProfile, DateProfileGenerator } from '../../DateProfileGenerator'
import { intersectRanges, DateMarker, DateEnv, createDuration, DateFormatter, formatIsoMonthStr, DateRange } from '@full-ui/headless-calendar'
import { memoize } from '../../util/memoize'
import { createFormatter } from '../../datelib/formatting'
import { NowTimer } from '../../NowTimer'
import { getIsHeightAuto } from '../../scrollgrid/util'
import { Scroller } from '../../scrollgrid/Scroller'
import { afterSize, watchWidth } from '../../component-util/resize-observer'
import { fracToCssDim } from '../../util/html'
import { RefMap } from '../../util/RefMap'
import classNames from '../../styles.module.css'
import { buildDayTableRenderRange } from '../../daygrid/TableDateProfileGenerator'
import { createRef } from 'react'
import { SingleMonth, SingleMonthHeights } from './SingleMonth'

interface MultiMonthViewState {
  innerWidth?: number
}

export class MultiMonthView extends DateComponent<ViewProps, MultiMonthViewState> {
  state = {} as MultiMonthViewState

  // memo
  private splitDateProfileByMonth = memoize(splitDateProfileByMonth)
  private buildMonthFormat = memoize(buildMonthFormat)

  // ref
  private scrollerRef = createRef<Scroller>()
  private innerElRef = createRef<HTMLDivElement>()
  private singleMonthHeightsRefMap = new RefMap<string, SingleMonthHeights>(() => {
    afterSize(this.handleSingleMonthHeights)
  })

  // internal
  private _isUnmounting: boolean
  private disconnectInnerWidth?: () => void
  private scrollDate: DateMarker | null = null
  private cols: number | undefined
  private monthDateProfiles: DateProfile[]

  render() {
    const { context, props, state, singleMonthHeightsRefMap } = this
    const { options } = context
    const verticalScrolling = !props.forPrint && !getIsHeightAuto(options)

    const monthDateProfiles = this.monthDateProfiles = this.splitDateProfileByMonth(
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
    this.cols = cols

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
                      heightsRef={singleMonthHeightsRefMap.createRef(monthStr)}
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
    this._isUnmounting = false
    this.scrollerRef.current.addScrollEndListener(this.handleScrollEnd)

    this.disconnectInnerWidth = watchWidth(this.innerElRef.current, (innerWidth: number) => {
      afterSize(() => {
        this.setState({ innerWidth })
      })
    })

    this.resetScroll()
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
    this._isUnmounting = true
    this.scrollerRef.current.removeScrollEndListener(this.handleScrollEnd)

    this.disconnectInnerWidth()
  }

  // Scrolling
  // -----------------------------------------------------------------------------------------------

  private handleSingleMonthHeights = () => {
    if (this._isUnmounting) return
    this.applyScroll()
  }

  private resetScroll() {
    this.scrollDate = this.props.dateProfile.currentDate
    this.applyScroll()
  }

  private applyScroll() {
    const { monthDateProfiles, cols, scrollDate, singleMonthHeightsRefMap, scrollerRef } = this
    const scroller = scrollerRef.current

    if (scroller && monthDateProfiles && cols != null && this.scrollDate != null) {
      const scrollTop = computeScrollTop(monthDateProfiles, cols, scrollDate, singleMonthHeightsRefMap.current)

      if (scrollTop != null) {
        scroller.scrollTo({ y: scrollTop })
      }
    }
  }

  private handleScrollEnd = (isUser: boolean) => {
    if (isUser) {
      this.scrollDate = null
    }
  }
}

// scroll
// -------------------------------------------------------------------------------------------------

// TODO: DRY with computeTopFromDate?
// TODO: what about gap between months!!??
function computeScrollTop(
  monthDateProfiles: DateProfile[],
  cols: number,
  scrollDate: DateMarker,
  singleMonthHeightsMap: Map<string, SingleMonthHeights>
): number | undefined {
  const isTitleAndHeaderSticky = cols === 1 // TODO: DRY
  let index = 0
  let top = 0
  let maxRowHeight = 0

  for (const monthDateProfile of monthDateProfiles) {
    const monthKey = formatIsoMonthStr(monthDateProfile.currentRange.start)
    const monthHeights = singleMonthHeightsMap.get(monthKey)
    if (!monthHeights) {
      return
    }

    let isCurrentMonth = // because multiple months might contain this date (potentially disabled)
      scrollDate >= monthDateProfile.currentRange.start &&
      scrollDate < monthDateProfile.currentRange.end

    const titleAndHeaderHeight = monthHeights.titleHeight + monthHeights.tableHeaderHeight
    let localTop = titleAndHeaderHeight

    for (const cells of monthHeights.cellRows) {
      const start = cells[0].date
      const end = cells[cells.length - 1].date

      if (isCurrentMonth && scrollDate >= start && scrollDate < end) {
        return top + localTop - (isTitleAndHeaderSticky ? titleAndHeaderHeight : 0)
      }

      const key = cells[0].key
      const rowHeight = monthHeights.rowHeightMap.get(key)
      if (rowHeight == null) {
        return
      }
      localTop += rowHeight
    }

    maxRowHeight = Math.max(maxRowHeight, localTop)
    index++
    if (!(index % cols)) { // after increment, at start of next month-row?
      top += maxRowHeight + 1 // HACK border
      maxRowHeight = 0
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
