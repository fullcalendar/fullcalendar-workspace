import { CssDimValue } from '../../scrollgrid/layout-options'
import { joinClassNames } from '../../util/html'
import { createViewComponent } from '../../views/view-config'
import { useViewContext } from '../../context/useViewContext'
import { useNow } from '../../now/useNow'
import { useInitialScroll } from '../../scrollgrid/useInitialScroll'
import { useMeasuredState } from '../../layout/useMeasuredState'
import { ViewProps } from '../../views/view-props'
import { ViewContainer } from '../../views/ViewContainer'
import { DateProfile, DateProfileGenerator } from '../../date-profile/DateProfileGenerator'
import { intersectRanges, DateMarker, DateEnv, createDuration, DateFormatter, formatIsoMonthStr } from '@full-ui/headless-calendar'
import { createFormatter } from '../../datelib/formatting'
import { getIsHeightAuto } from '../../scrollgrid/layout-options'
import { Scroller } from '../../scrollgrid/Scroller'
import { fracToCssDim } from '../../util/html'
import classNames from '../../styles.module.css'
import { buildDayTableRenderRange } from '../../day-table/render-range'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Ruler } from '../../scrollgrid/Ruler'
import { SingleMonth } from './SingleMonth'

// memoized on its props, and marked as a view (see createViewComponent)
export const MultiMonthView = createViewComponent(MultiMonthViewBody)

function MultiMonthViewBody(props: ViewProps) {
  const context = useViewContext()
  const { options } = context
  const verticalScrolling = !props.forPrint && !getIsHeightAuto(options)
  const { todayRange } = useNow('day')
  const [innerWidth, setInnerWidth] = useMeasuredState()

  const monthDateProfiles = useMemo(
    () => splitDateProfileByMonth(
      context.dateProfileGenerator,
      props.dateProfile,
      context.dateEnv,
      options.fixedWeekCount,
      options.showNonCurrentDates,
    ),
    [context.dateProfileGenerator, props.dateProfile, context.dateEnv, options.fixedWeekCount, options.showNonCurrentDates],
  )

  const monthTitleFormat = useMemo(
    () => buildMonthFormat(options.singleMonthTitleFormat, monthDateProfiles),
    [options.singleMonthTitleFormat, monthDateProfiles],
  )

  // scrolls to the current date's month, or where the user scrolled to
  const scrollerRef = useRef<Scroller | null>(null)
  const tilesElRef = useRef<HTMLDivElement | null>(null)
  const scroll = useInitialScroll<DateMarker>({
    scrollerRef,
    isEnabled: !props.forPrint,
    createInitial: () => props.dateProfile.currentDate,
    resetKey: props.dateProfile,
    isResetOnChange: options.scrollTimeReset,
    project(date) {
      const tilesEl = tilesElRef.current
      const monthEl = tilesEl?.querySelector<HTMLElement>(`[data-date="${formatIsoMonthStr(date)}"]`)
      const monthWrapEl = monthEl?.parentElement as HTMLElement | null

      // not before the months are sized, which needs the inner width
      if (innerWidth != null && tilesEl && monthWrapEl) {
        // rounding required for proper alignment
        const monthTop = Math.round(monthWrapEl.getBoundingClientRect().top)
        const originTop = Math.round(tilesEl.getBoundingClientRect().top)
        return { y: monthTop - originTop }
      }
    },
    isUserScroll: (isDevice) => isDevice,
    readPosition: (scroller) => ({ y: scroller.y }),
  })

  // the months move when the inner width or the date range changes
  useLayoutEffect(() => {
    scroll.handleGeometry()
  }, [innerWidth, props.dateProfile])

  // workaround for off-by-a-few-pixels on first time when multiMonthMaxColumns=1, not sure why
  useLayoutEffect(() => {
    const timeoutId = setTimeout(scroll.handleGeometry, 0)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  const { multiMonthMaxColumns, singleMonthMinWidth } = options

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
        ref={scrollerRef}
      >
        <div
          role='list'
          ref={tilesElRef}
          aria-labelledby={props.labelId}
          aria-label={props.labelStr}
          className={classNames.safeTiles}
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
                isFirst={!i}
                isLast={i === monthDateProfiles.length - 1}
                hasLateralSiblings={hasLateralSiblings}
              />
            )
          })}
        </div>
      </Scroller>
      <Ruler widthRef={setInnerWidth} />
    </ViewContainer>
  )
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
