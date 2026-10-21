import { joinClassNames } from '../../util/html'
import { CustomContent } from '../../render-hook/CustomContent'
import { renderText, generateClassName } from '../../render-hook/render-hook-types'
import { useDateEnv } from '../../context/useGranularContexts'
import { useRenderHookEl } from '../../render-hook/useRenderHookEl'
import { useReportedSize } from '../../layout/useReportedSize'
import { memoize } from '../../util/memoize'
import { COL_BORDER_WIDTH } from '../../layout/border-widths'
import { createElement, memo, useState, type CSSProperties, type Ref } from 'react'
import { BaseDayHeaderData, CellDataConfig, CellRenderConfig } from '../../day-table/header-tier'
import { dayHeaderMicroFormat } from '../../day-table/day-header-format'
import classNames from '../../styles.module.css'
import { DateFormatter, DateMarker, DateTimeFormatPartWithWeek, joinDateTimeFormatParts } from '@full-ui/headless-calendar'
import { findDayNumberText, findWeekdayText } from '../../util/date-format'

export interface DayGridHeaderCellProps<BaseRenderProps, RenderProps> {
  renderConfig: CellRenderConfig<BaseRenderProps, RenderProps>
  dataConfig: CellDataConfig<BaseRenderProps>
  borderStart: boolean
  colWidth?: number
  viewportWidth?: number
  innerHeightRef?: Ref<number>
  cellIsNarrow: boolean
  cellIsMicro: boolean
  rowLevel: number
  tableMode?: boolean
  borderBottom?: boolean
}

function DayGridHeaderCellImpl<
  BaseRenderProps extends { isDisabled: boolean },
  RenderProps extends { text: string, isDisabled: boolean },
>(props: DayGridHeaderCellProps<BaseRenderProps, RenderProps>) {
  const { dataConfig, tableMode } = props
  const colSpan = dataConfig.colSpan || 1
  const totalColWidth = props.colWidth != null
    ? props.colWidth * colSpan
    : undefined
  const isLiquid = !tableMode && totalColWidth == null

  /*
  A liquid cell that spans multiple columns can't use the .liquid class, which gives every
  cell an equal share regardless of colSpan. Instead, grow proportionally to the columns
  covered, reserving space for the internal column borders swallowed by the span.
  Include this cell's own start border because flex-basis uses border-box sizing.
  */
  const isSpanning = isLiquid && colSpan > 1
  const style = tableMode ? undefined : isSpanning ? {
    flexGrow: colSpan,
    flexBasis: (colSpan - 1) * COL_BORDER_WIDTH + (props.borderStart ? COL_BORDER_WIDTH : 0),
    minWidth: 0,
  } : {
    width: totalColWidth,
  }

  const CellTag = tableMode ? 'th' : 'div'
  const baseClassName = joinClassNames(
    dataConfig.className,
    classNames.noMargin,
    classNames.noPadding,
    !tableMode && classNames.flexCol,
    classNames.borderlessTop,
    classNames.borderlessEnd,
    !props.borderStart && classNames.borderlessStart,
    !(tableMode && props.borderBottom) && classNames.borderlessBottom,
    isLiquid && !isSpanning && classNames.liquid,
  )

  // Structural gaps share cell geometry but never invoke the row's render hooks.
  if (dataConfig.blank) {
    return (
      <CellTag
        role='cell' // is empty so can't be columnheader
        aria-colspan={dataConfig.colSpan}
        colSpan={tableMode ? colSpan : undefined}
        {...dataConfig.attrs}
        className={joinClassNames(
          baseClassName,
          generateClassName(dataConfig.blank.classNameGenerator, {
            ...dataConfig.renderProps,
            isNarrow: props.cellIsNarrow,
          }),
        )}
        style={style}
      />
    )
  }

  return (
    <DayGridHeaderCellLabel
      {...props}
      cellTag={CellTag}
      colSpan={colSpan}
      totalColWidth={totalColWidth}
      baseClassName={baseClassName}
      style={style}
    />
  )
}

interface DayGridHeaderCellLabelProps<BaseRenderProps, RenderProps>
  extends DayGridHeaderCellProps<BaseRenderProps, RenderProps> {
  cellTag: 'th' | 'div'
  colSpan: number
  totalColWidth: number | undefined
  baseClassName: string
  style: CSSProperties | undefined
}

// a cell that isn't a structural gap. only these have the row's render hooks
function DayGridHeaderCellLabel<
  BaseRenderProps extends { isDisabled: boolean },
  RenderProps extends { text: string, isDisabled: boolean },
>(props: DayGridHeaderCellLabelProps<BaseRenderProps, RenderProps>) {
  const dateEnv = useDateEnv()
  const { renderConfig, dataConfig, tableMode, colSpan, totalColWidth } = props
  const [innerWidth, setInnerWidth] = useState<number | undefined>(undefined)
  // called twice per render when micro, so a memoize instance rather than useMemo
  const [buildText] = useState(() => memoize(buildDayHeaderText))

  // HACK
  const isDisabled = dataConfig.renderProps.isDisabled
  const finalRenderProps = renderConfig.dayHeaderFormat
    ? buildDayHeaderRenderProps(
        buildText,
        dataConfig.renderProps as unknown as BaseDayHeaderData,
        props.cellIsNarrow,
        props.rowLevel,
        props.cellIsMicro,
        dataConfig.dateMarker,
        renderConfig.dayHeaderFormat,
        Boolean(renderConfig.datesRepDistinctDays),
        dateEnv,
      ) as unknown as RenderProps
    : {
        ...(dataConfig.renderProps as any),
        isNarrow: props.cellIsNarrow,
        level: props.rowLevel,
      }

  /*
  TODO: DRY with TimelineHeaderCell
  */
  const alignInput = renderConfig.align
  const align = // normalized string-enum value
    typeof alignInput === 'function'
      ? alignInput({ level: props.rowLevel, inPopover: (dataConfig.renderProps as any).inPopover, isNarrow: props.cellIsNarrow })
      : alignInput
  const stickyInput = renderConfig.sticky
  const isSticky = !tableMode &&
    props.rowLevel > 0 &&
    stickyInput !== false && (
      // if center-aligned, and wants to be sticky, must be >75% viewport width,
      // to avoid looking awkwardly aligned
      align !== 'center' || (
        totalColWidth != null &&
        props.viewportWidth != null &&
        totalColWidth > props.viewportWidth * 0.75
      )
    )

  let edgeCoord: number | string | undefined
  if (isSticky) {
    if (align === 'center') {
      if (innerWidth != null) {
        edgeCoord = `calc(50% - ${innerWidth / 2}px)`
      }
    } else {
      edgeCoord = (
        typeof stickyInput === 'number' ||
        typeof stickyInput === 'string'
      ) ? stickyInput: 0
    }
  }

  /*
  In screen mode, alignment belongs on the outer flex cell so the inner element
  remains shrink-wrapped for sticky positioning measurements. In table mode, the
  <th> must remain a table cell, so alignment moves to its full-width inner flex
  element. That width cannot support sticky positioning, which table mode disables.
  */
  const alignClassName = align === 'center' ? classNames.alignCenter :
    align === 'end' ? classNames.alignEnd :
      classNames.alignStart

  const renderHookEl = useRenderHookEl({
    // don't use custom classNames if disabled
    // TODO: make DRY with DayCellContainer
    classGenerator: isDisabled ? undefined : renderConfig.classNameGenerator,
    didMount: renderConfig.didMount,
    willUnmount: renderConfig.willUnmount,
    renderProps: finalRenderProps,
  })
  const innerElRef = useReportedSize({
    watchWidth: true,
    watchHeight: true,
    heightRef: props.innerHeightRef,
    onSize(width) {
      setInnerWidth(width)
    },
  })

  return createElement(
    props.cellTag,
    {
      role: 'columnheader',
      'aria-colspan': dataConfig.colSpan,
      colSpan: tableMode ? colSpan : undefined,
      ...dataConfig.attrs,
      ref: renderHookEl.ref,
      className: joinClassNames(
        renderHookEl.className,
        props.baseClassName,
        !tableMode && alignClassName,
        !isSticky && classNames.crop,
        dataConfig.attrs?.className,
      ),
      style: props.style,
    },
    dataConfig.a11yText && (
      <div className={classNames.srOnly}>{dataConfig.a11yText}</div>
    ),
    <div
      // hide the whole wrapper, otherwise screen readers find an empty group
      aria-hidden={dataConfig.a11yText ? true : undefined}
      ref={innerElRef}
      className={joinClassNames(
        classNames.flexCol,
        classNames.noShrink,
        classNames.whiteSpaceNoWrap,
        tableMode && alignClassName,
        isSticky && classNames.sticky,
      )}
      style={{
        left: edgeCoord,
        right: edgeCoord,
      }}
    >
      <CustomContent
        tag='div'
        attrs={dataConfig.innerAttrs}
        className={generateClassName(renderConfig.innerClassNameGenerator, finalRenderProps)}
        renderProps={finalRenderProps}
        generatorName={renderConfig.generatorName}
        generator={renderConfig.customGenerator}
        fallback={renderText}
      />
    </div>,
  )
}

export const DayGridHeaderCell = memo(DayGridHeaderCellImpl) as unknown as typeof DayGridHeaderCellImpl

function buildDayHeaderRenderProps(
  buildText: typeof buildDayHeaderText,
  renderProps: BaseDayHeaderData,
  cellIsNarrow: boolean,
  rowLevel: number,
  cellIsMicro: boolean,
  dateMarker: DateMarker,
  dayHeaderFormat: DateFormatter,
  datesRepDistinctDays: boolean,
  dateEnv,
): DayHeaderRenderProps {
  const baseText = buildText(
    datesRepDistinctDays ? dateMarker : renderProps.date,
    dayHeaderFormat,
    datesRepDistinctDays,
    dateEnv,
  )

  const textData = cellIsMicro
    ? buildText(dateMarker, dayHeaderMicroFormat, false, dateEnv)
    : baseText

  return {
    ...renderProps,
    isNarrow: cellIsNarrow,
    level: rowLevel,
    text: textData.text,
    textParts: textData.textParts,
    weekdayText: cellIsMicro ? textData.text : baseText.weekdayText,
    dayNumberText: baseText.dayNumberText,
  }
}

interface DayHeaderRenderProps extends BaseDayHeaderData {
  text: string
  textParts: DateTimeFormatPartWithWeek[]
  weekdayText: string
  dayNumberText: string
  isNarrow: boolean
  level: number
}

function buildDayHeaderText(
  date: DateMarker,
  formatter: DateFormatter,
  includeDayNumber: boolean,
  dateEnv,
) {
  const textParts = dateEnv.formatToParts(date, formatter)

  return {
    text: joinDateTimeFormatParts(textParts),
    textParts,
    weekdayText: findWeekdayText(textParts),
    dayNumberText: includeDayNumber ? findDayNumberText(textParts) : '',
  }
}
