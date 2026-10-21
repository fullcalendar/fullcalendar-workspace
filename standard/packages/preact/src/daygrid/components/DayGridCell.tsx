import { ViewApi } from '../../api/ViewApi'
import { DayCellInfo } from '../../render-hook-misc'
import { joinClassNames } from '../../util/html'
import { DateMarker, DateRange, DateEnv, addMs, DateFormatter, formatDayString } from '@full-ui/headless-calendar'
import { joinDateTimeFormatParts } from '@full-ui/headless-calendar'
import { EventSegUiInteractionState } from '../../component/DateComponent'
import { DateProfile } from '../../DateProfileGenerator'
import { Dictionary } from '../../options'
import { setRef } from '../../vdom-util'
import { SlicedCoordRange } from '../../coord-range'
import { watchSize } from '../../component-util/resize-observer'
import { isDimsEqual } from '../../component-util/rendering-misc'
import { getDateMeta, DateMeta } from '../../component-util/date-rendering'
import { buildDateStr, buildNavLinkAttrs } from '../../common/nav-link'
import { CustomContent } from '../../content-inject/CustomContent'
import { useViewContext } from '../../hooks/useViewContext'
import { useViewOptions } from '../../hooks/useGranularContexts'
import { useRenderHookEl } from '../../hooks/useRenderHookEl'
import { generateClassName } from '../../common/render-hook'
import { findDayNumberText, findMonthText, findWeekdayText } from '../../util/date-format'
import classNames from '../../styles.module.css'
import {
  type Ref,
  type RefObject,
  type ReactNode,
  createElement,
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLatest } from '../../hooks/useLatest'
import { DayGridMoreLink } from './DayGridMoreLink'
import { DayRowEventRange, DayRowEventRangePart } from '../TableSeg'
import { DAY_GRID_CELL_CONTENT_Z_CLASS } from './z-index'

export interface DayGridCellProps {
  dateProfile: DateProfile
  todayRange: DateRange
  date: DateMarker
  isMajor: boolean
  isDisabled: boolean
  showDayNumber: boolean
  isNarrow: boolean
  isMicro: boolean
  borderStart: boolean
  borderBottom?: boolean
  tableMode?: boolean

  // content
  fills: ReactNode
  segs: DayRowEventRangePart[] // for +more link popover content
  hiddenSegs: DayRowEventRange[] // "
  fgLiquidHeight: boolean
  fg: ReactNode
  fgIsList?: boolean // whether fg contains list items
  eventDrag: EventSegUiInteractionState<SlicedCoordRange> | null
  eventResize: EventSegUiInteractionState<SlicedCoordRange> | null
  eventSelection: string

  // render hooks
  renderProps?: Dictionary
  dateSpanProps?: Dictionary
  attrs?: Dictionary
  className?: string

  // dimensions
  fgHeight: number | undefined
  width?: number | string

  // refs
  headerHeightRef?: Ref<number>
  mainHeightRef?: Ref<number> // height of the area events and the +more link share
}

export const DayGridCell = memo(function DayGridCell(props: DayGridCellProps) {
  const context = useViewContext()
  const { options, dateEnv } = context
  const { tableMode } = props
  const rootElRef = useRef<HTMLElement | null>(null)
  const handleBodyEl = useBodyHeights(rootElRef, props.headerHeightRef, props.mainHeightRef)

  // TODO: memoize this
  const isMonthStart = props.showDayNumber &&
    shouldDisplayMonthStart(props.date, props.dateProfile.currentRange, dateEnv)

  const dateMeta = useMemo(
    () => getDayGridCellDateMeta(
      props.date,
      dateEnv,
      props.dateProfile,
      props.todayRange,
      props.isDisabled,
    ),
    [props.date, dateEnv, props.dateProfile, props.todayRange, props.isDisabled],
  )

  const baseClassName = joinClassNames(
    classNames.borderlessTop,
    classNames.borderlessEnd,
    !props.borderStart && classNames.borderlessStart,
    !(tableMode && props.borderBottom) && classNames.borderlessBottom,
    !tableMode && props.width == null && classNames.liquid,
    !tableMode && classNames.flexCol,
    classNames.rel,
    classNames.noMargin,
    classNames.noPadding,
  )
  const CellTag = tableMode ? 'td' : 'div'
  const cellStyle = tableMode ? undefined : { width: props.width }

  const hasNavLink = options.navLinks
  const { viewApi } = context
  const { monthStartFormat, dayCellFormat } = options
  const businessHours = Boolean(options.businessHours)
  const renderProps = useMemo(
    () => refineRenderProps({
      date: props.date,
      isMajor: props.isMajor,
      isNarrow: props.isNarrow,
      dateMeta: dateMeta,
      hasLabel: props.showDayNumber,
      hasMonthLabel: isMonthStart,
      hasNavLink,
      renderProps: props.renderProps,
      viewApi,
      dateEnv,
      monthStartFormat,
      dayCellFormat,
      businessHours,
    }),
    [
      props.date, props.isMajor, props.isNarrow, dateMeta, props.showDayNumber, isMonthStart,
      hasNavLink, props.renderProps, viewApi, dateEnv, monthStartFormat, dayCellFormat, businessHours,
    ],
  )

  if (dateMeta.isDisabled) {
    return (
      <CellTag
        role='cell'
        aria-disabled
        className={joinClassNames(
          generateClassName(options.dayCellClass, renderProps),
          props.className,
          baseClassName,
        )}
        style={cellStyle}
      >
        {props.fills}
      </CellTag>
    )
  }

  const fullDateStr = buildDateStr(context, props.date)
  // only when the day number is shown: otherwise, the column header already reads the full date
  const hasA11yDateText = props.showDayNumber && !hasNavLink

  return (
    <DayGridCellEl
      tag={CellTag}
      elRef={rootElRef}
      className={joinClassNames(props.className, baseClassName)}
      attrs={{
        ...props.attrs,
        role: 'cell',
        ...(renderProps.isToday ? { 'aria-current': 'date' } : {}),
        'data-date': formatDayString(props.date),
      }}
      style={cellStyle}
      renderProps={renderProps}
    >
      {props.fills}
      <div
        // otherwise VoiceOver finds an empty group when there's no day number (ex: TimeGrid all-day).
        // children (srOnly date, day number, custom content) stay readable
        role='presentation'
        className={joinClassNames(
          classNames.rel, // puts it above bg-fills, which are positioned on TOP of this component :|
          DAY_GRID_CELL_CONTENT_Z_CLASS,
          generateClassName(options.dayCellTopClass, renderProps),
        )}
        // TODO: prevent margins/padding!?
      >
        {hasA11yDateText && ( // a nav link is already labeled
          <div className={classNames.srOnly}>{fullDateStr}</div>
        )}
        {props.showDayNumber && (
          <CustomContent
            tag='div'
            attrs={
              hasNavLink
                ? buildNavLinkAttrs(
                  context,
                  props.date,
                  undefined,
                  fullDateStr,
                )
                : { 'aria-hidden': true } // screen readers read the srOnly full date above, not this day number
            }
            className={generateClassName(options.dayCellTopInnerClass, renderProps)}
            renderProps={renderProps}
            generatorName="dayCellTopContent"
            generator={options.dayCellTopContent}
            fallback={renderTopInner}
          />
        )}
      </div>
      <div
        className={joinClassNames(
          !tableMode && classNames.flexCol,
          !tableMode && (
            props.fgLiquidHeight ? classNames.liquid : classNames.grow
          ),
          tableMode && classNames.printCellContentMinHeight,
        )}
        ref={handleBodyEl}
      >
        <div
          // without events of its own, it's still sized (space reserved for multi-day events from
          // earlier days), and VoiceOver would find an empty group
          role={props.fgIsList ? 'list' : 'presentation'}
          className={joinClassNames(
            classNames.rel, // origin for this cell's foreground event wrappers
            generateClassName(options.dayCellInnerClass, renderProps),
          )}
          style={{ minHeight: props.fgHeight }}
          // TODO: prevent margins/padding!?
        >
          {props.fg}
        </div>
        <DayGridMoreLink
          className={classNames.rel} // puts it above bg-fills, which are positioned on TOP of this component :|
          allDayDate={props.date}
          segs={props.segs}
          hiddenSegs={props.hiddenSegs}
          alignElRef={rootElRef}
          alignParentTop={
            props.showDayNumber
              ? '[role=row]'
              : `.${classNames.internalView}`
          }
          dateSpanProps={props.dateSpanProps}
          renderProps={props.renderProps}
          dateProfile={props.dateProfile}
          eventSelection={props.eventSelection}
          eventDrag={props.eventDrag}
          eventResize={props.eventResize}
          todayRange={props.todayRange}
          isNarrow={props.isNarrow}
          isMicro={props.isMicro}
        />
      </div>
      <div
        role='presentation' // otherwise VoiceOver finds an empty group. not aria-hidden, which would hide any content too
        className={joinClassNames(
          classNames.rel, // puts it above bg-fills
          DAY_GRID_CELL_CONTENT_Z_CLASS,
          generateClassName(options.dayCellBottomClass, renderProps),
        )}
      />
    </DayGridCellEl>
  )
})

/*
Reports where the body starts (the header's height) and the body's height. On any size change of the
body, because the row places events from both
*/
function useBodyHeights(
  rootElRef: RefObject<HTMLElement | null>,
  headerHeightRef: Ref<number> | undefined,
  mainHeightRef: Ref<number> | undefined,
): (bodyEl: HTMLElement | null) => void {
  const bodyElRef = useRef<HTMLElement | null>(null)
  const [handleBodyEl] = useState(() => (bodyEl: HTMLElement | null) => {
    bodyElRef.current = bodyEl
  })
  const targetsRef = useLatest({ headerHeightRef, mainHeightRef })
  const watchingRef = useRef<{ el: HTMLElement, disconnect: () => void } | null>(null)
  const headerHeightReportedRef = useRef<number | undefined>(undefined)
  // Print cells don't need this screen-only measurement.
  const isMeasured = Boolean(headerHeightRef || mainHeightRef)

  const release = () => {
    watchingRef.current.disconnect()
    watchingRef.current = null
    headerHeightReportedRef.current = undefined
    setRef(targetsRef.current.headerHeightRef, null)
    setRef(targetsRef.current.mainHeightRef, null)
  }

  // every commit: follow the body element
  useLayoutEffect(() => {
    const bodyEl = isMeasured ? bodyElRef.current : null

    if (bodyEl !== watchingRef.current?.el) {
      if (watchingRef.current) {
        release()
      }

      if (bodyEl) {
        watchingRef.current = {
          el: bodyEl,
          disconnect: watchSize(bodyEl, (_bodyWidth, bodyHeight) => {
            const rootEl = rootElRef.current

            // A queued resize can outlive the cell element.
            if (watchingRef.current?.el !== bodyEl || !rootEl) {
              return
            }

            const mainRect = bodyEl.getBoundingClientRect()
            const rootRect = rootEl.getBoundingClientRect()
            const headerHeight = mainRect.top - rootRect.top

            if (!isDimsEqual(headerHeightReportedRef.current, headerHeight)) {
              headerHeightReportedRef.current = headerHeight
              setRef(targetsRef.current.headerHeightRef, headerHeight)
            }

            /*
            Reported in every mode, even though only a liquid cell's placement
            consumes it. The body keeps the same element and the same observer when
            `fgLiquidHeight` flips, and switching it between `grow` and `liquid`
            need not change its height at all, so a mode-conditional report would
            leave a newly liquid cell waiting for an unrelated resize before it
            ever learned its own ceiling.
            */
            setRef(targetsRef.current.mainHeightRef, bodyHeight)
          }),
        }
      }
    }
  })

  useLayoutEffect(() => () => {
    if (watchingRef.current) {
      release()
    }
  }, [])

  return handleBodyEl
}

interface DayGridCellElProps {
  tag: 'td' | 'div'
  elRef: Ref<HTMLElement>
  className: string
  attrs: Record<string, any>
  style: { width?: number | string } | undefined
  renderProps: DayCellInfo
  children: ReactNode
}

// the cell's element, with its dayCell* render hooks. only for enabled days
function DayGridCellEl({ tag, elRef, className, attrs, style, renderProps, children }: DayGridCellElProps) {
  const options = useViewOptions()
  const renderHookEl = useRenderHookEl({
    classGenerator: options.dayCellClass,
    didMount: options.dayCellDidMount,
    willUnmount: options.dayCellWillUnmount,
    renderProps,
    elRef,
  })

  return createElement(
    tag,
    {
      ...attrs,
      ref: renderHookEl.ref,
      className: joinClassNames(renderHookEl.className, className, attrs.className),
      style,
    },
    children,
  )
}

// Utils
// -------------------------------------------------------------------------------------------------

function getDayGridCellDateMeta(
  date: DateMarker,
  dateEnv: DateEnv,
  dateProfile: DateProfile,
  todayRange: DateRange,
  isDisabled: boolean,
): DateMeta {
  return {
    ...getDateMeta(date, dateEnv, dateProfile, todayRange),
    isDisabled,
  }
}

function renderTopInner(props: DayCellInfo): ReactNode {
  return props.text || <>&nbsp;</> // TODO: DRY?
}

function shouldDisplayMonthStart(date: DateMarker, currentRange: DateRange, dateEnv: DateEnv): boolean {
  const { start: currentStart, end: currentEnd } = currentRange
  const currentEndIncl = addMs(currentEnd, -1)
  const currentFirstYear = dateEnv.getYear(currentStart)
  const currentFirstMonth = dateEnv.getMonth(currentStart)
  const currentLastYear = dateEnv.getYear(currentEndIncl)
  const currentLastMonth = dateEnv.getMonth(currentEndIncl)

  // spans more than one month?
  return !(currentFirstYear === currentLastYear && currentFirstMonth === currentLastMonth) &&
    Boolean(
      // first date in current view?
      date.valueOf() === currentStart.valueOf() ||
      // a month-start that's within the current range?
      (dateEnv.getDay(date) === 1 && date.valueOf() < currentEnd.valueOf()),
    )
}

interface DayCellRenderPropsInput {
  date: DateMarker // generic
  isMajor: boolean
  isNarrow: boolean
  dateMeta: DateMeta
  dateEnv: DateEnv
  viewApi: ViewApi
  dayCellFormat: DateFormatter
  monthStartFormat: DateFormatter
  hasLabel: boolean
  hasMonthLabel: boolean
  hasNavLink: boolean
  businessHours: boolean
  renderProps?: Dictionary // so can include a resource
}

function refineRenderProps(raw: DayCellRenderPropsInput): DayCellInfo {
  let { date, dateEnv, hasLabel, hasMonthLabel, hasNavLink, businessHours } = raw
  let textParts = []
  let text = ''

  if (hasLabel) {
    textParts = dateEnv.formatToParts(date, hasMonthLabel ? raw.monthStartFormat : raw.dayCellFormat)
    text = joinDateTimeFormatParts(textParts)
  }

  return {
    ...raw.dateMeta,
    ...raw.renderProps,
    text,
    textParts,
    isMajor: raw.isMajor,
    isNarrow: raw.isNarrow,
    inPopover: false,
    hasNavLink,
    get weekdayText() { return findWeekdayText(textParts) },
    get dayNumberText() { return findDayNumberText(textParts) },
    get monthText() { return findMonthText(textParts) },
    options: { businessHours },
    view: raw.viewApi,
  }
}
