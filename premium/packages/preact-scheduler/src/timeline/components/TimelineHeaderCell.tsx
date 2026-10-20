import { SlotHeaderInfo, joinClassNames } from '@fullcalendar/preact/public-api'
import {
  afterSize,
  buildNavLinkAttrs,
  CustomContent,
  DateMarker,
  DateProfile,
  DateRange,
  generateClassName,
  getDateMeta,
  useLatest,
  useRenderHookEl,
  useReportedSize,
  useViewContext,
} from '@fullcalendar/preact/protected-api'
import { memo, useMemo, useRef, useState, type Ref } from 'react'
import { TimelineDateProfile, TimelineHeaderCellData } from '../timeline-date-profile'
import { applyExactSlotMeta } from '../timeline-time-axis'
import classNames from '@fullcalendar/preact/protected-styles'

export interface TimelineHeaderCellProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  rowLevel: number // 0 is closest to divider (like "ground floor")
  cell: TimelineHeaderCellData
  todayRange: DateRange
  nowDate: DateMarker
  nowMs: number
  isFirst: boolean

  // dimensions
  slotWidth: number | undefined // always provided. if pending, use `undefined`

  // refs
  innerHeightRef?: Ref<number>
  innerWidthRef?: Ref<number>
}

export const TimelineHeaderCell = memo(function TimelineHeaderCell(props: TimelineHeaderCellProps) {
  let context = useViewContext()
  let { dateEnv, options } = context
  let { cell, dateProfile, tDateProfile } = props
  let [innerWidth, setInnerWidth] = useState<number | undefined>(undefined)

  // the cell.rowUnit is f'd
  // giving 'month' for a 3-day view
  // workaround: to infer day, do NOT time

  let baseDateMeta = useMemo(
    () => getDateMeta(cell.date, dateEnv, dateProfile, props.todayRange, props.nowDate),
    [cell.date, dateEnv, dateProfile, props.todayRange, props.nowDate],
  )
  let dateMeta = useMemo(
    () => applyExactSlotMeta(baseDateMeta, cell.startMs, props.nowMs),
    [baseDateMeta, cell.startMs, props.nowMs],
  )
  let hasNavLink = options.navLinks && !dateMeta.isDisabled && (cell.rowUnit && cell.rowUnit !== 'time')
  let isTime = tDateProfile.isTimeScale && !props.rowLevel // HACK: faulty way of determining this

  let renderProps = {
    ...dateMeta,
    level: props.rowLevel,
    isMajor: cell.isMajor,
    isMinor: false,
    isNarrow: false,
    isTime,
    hasNavLink,
    text: cell.text,
    isFirst: props.isFirst,
    view: context.viewApi,
  }

  const { slotHeaderAlign } = options
  const align =
    typeof slotHeaderAlign === 'function'
      ? slotHeaderAlign({ level: props.rowLevel, isTime })
      : slotHeaderAlign

  const isSticky =
    props.rowLevel && options.slotHeaderSticky !== false

  let edgeCoord: number | string | undefined

  if (isSticky) {
    if (align === 'center') {
      if (innerWidth != null) {
        edgeCoord = `calc(50% - ${innerWidth / 2}px)`
      }
    } else {
      edgeCoord = (
        typeof options.slotHeaderSticky === 'number' ||
        typeof options.slotHeaderSticky === 'string'
      ) ? options.slotHeaderSticky : 0
    }
  }

  let renderHookEl = useRenderHookEl({
    classGenerator: options.slotHeaderClass,
    didMount: options.slotHeaderDidMount,
    willUnmount: options.slotHeaderWillUnmount,
    renderProps,
  })

  // a centered sticky label is offset by half its width
  let isCenteredSticky = Boolean(isSticky) && align === 'center'
  let latestRef = useLatest({ isCenteredSticky })
  let measuredWidthRef = useRef<number | undefined>(undefined)
  let [publishInnerWidth] = useState(() => () => {
    setInnerWidth(measuredWidthRef.current)
  })
  let innerWrapperElRef = useReportedSize({
    watchWidth: true,
    watchHeight: true,
    widthRef: props.innerWidthRef,
    heightRef: props.innerHeightRef,
    onSize(width) {
      if (latestRef.current.isCenteredSticky) {
        measuredWidthRef.current = width
        afterSize(publishInnerWidth)
      }
    },
  })

  return (
    <div
      ref={renderHookEl.ref}
      className={joinClassNames(
        renderHookEl.className,
        classNames.noMargin,
        classNames.noPadding,
        classNames.flexCol,
        classNames.borderlessY,
        classNames.borderlessEnd,
        props.isFirst && classNames.borderlessStart,
        align === 'center' ? classNames.alignCenter :
          align === 'end' ? classNames.alignEnd :
            classNames.alignStart,
        classNames.internalTimelineSlot,
      )}
      data-date={dateEnv.formatIso(cell.date, {
        omitTime: !tDateProfile.isTimeScale,
        omitTimeZoneOffset: true,
      })}
      aria-current={dateMeta.isToday ? 'date' : undefined}
      style={{
        width: props.slotWidth != null
          ? props.slotWidth * cell.colspan
          : undefined,
      }}
    >
      <div
        ref={innerWrapperElRef}
        className={joinClassNames(
          classNames.flexCol,
          classNames.noShrink,
          classNames.whiteSpaceNoWrap,
          isSticky && classNames.sticky,
        )}
        style={{
          left: edgeCoord,
          right: edgeCoord,
        }}
      >
        <CustomContent
          tag="div"
          attrs={
            hasNavLink
              // not tabbable because parent is aria-hidden
              ? buildNavLinkAttrs(
                context,
                cell.date,
                cell.rowUnit,
                undefined,
                /* isTabbable = */ false,
              )
              : NO_ATTRS // don't bother with aria-hidden because parent already hidden
          }
          className={generateClassName(options.slotHeaderInnerClass, renderProps)}
          renderProps={renderProps}
          generatorName="slotHeaderContent"
          generator={options.slotHeaderContent}
          fallback={renderInnerContent}
        />
      </div>
    </div>
  )
})

const NO_ATTRS = {}

// Utils
// -------------------------------------------------------------------------------------------------

function renderInnerContent(renderProps: SlotHeaderInfo) {
  return renderProps.text
}
