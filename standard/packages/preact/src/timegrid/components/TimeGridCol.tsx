import { DayLaneInfo } from '../../common/DayLaneContainer'
import { joinClassNames } from '../../util/html'
import { BgEvent, renderFill } from '../../common/bg-fill'
import { buildEventRangeKey, EventRangeProps, getEventRangeMeta, sortEventSegs } from '../../component-util/event-rendering'
import { useRenderHookEl } from '../../hooks/useRenderHookEl'
import { useViewContext } from '../../hooks/useViewContext'
import { memo, useMemo, type ReactNode } from 'react'
import { generateClassName } from '../../common/render-hook'
import { DateMarker, DateRange, formatDayString } from '@full-ui/headless-calendar'
import { DateProfile } from '../../DateProfileGenerator'
import { Dictionary, ViewOptionsRefined } from '../../options'
import { EventSegUiInteractionState } from '../../component/DateComponent'
import { fracToCssDim } from '../../util/html'
import { getDateMeta } from '../../component-util/date-rendering'
import classNames from '../../styles.module.css'
import { TimeGridRange } from '../TimeColsSeg'
import {
  buildTimeGridSegPlacements,
  computeFgSegVerticals,
  type TimeGridSegHiddenGroup,
  type TimeGridSegPlacement,
  type TimeGridSegVertical,
} from '../seg-placement-adapter'
import { ESTIMATED_SLAT_HEIGHT } from '../slat-estimate'
import { computeTimeGridPrintMode } from '../print-mode'
import { TimeGridEvent } from './TimeGridEvent'
import { TimeGridMoreLink } from './TimeGridMoreLink'
import { TimeGridNowIndicatorLine } from './TimeGridNowIndicatorLine'

export interface TimeGridColProps {
  dateProfile: DateProfile
  nowDate: DateMarker
  nowMs?: number
  todayRange: DateRange
  date: DateMarker
  isMajor: boolean
  slatCnt: number
  attrs?: any
  renderProps?: any
  dateSpanProps?: Dictionary
  forPrint: boolean
  borderStart: boolean
  isNarrow: boolean
  isMicro: boolean

  // content
  fgEventSegs: (TimeGridRange & EventRangeProps)[]
  bgEventSegs: (TimeGridRange & EventRangeProps)[]
  businessHourSegs: (TimeGridRange & EventRangeProps)[]
  nowIndicatorSegs: TimeGridRange[]
  dateSelectionSegs: (TimeGridRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<TimeGridRange> | null
  eventResize: EventSegUiInteractionState<TimeGridRange> | null
  eventSelection: string

  // dimensions
  width: number | undefined
  slatHeight: number | undefined
}

export const TimeGridCol = memo(function TimeGridCol(props: TimeGridColProps) {
  const context = useViewContext()
  const { options, dateEnv } = context
  const isSelectMirror = options.selectMirror

  const mirrorSegs: (TimeGridRange & EventRangeProps)[] = // yuck
    (props.eventDrag && props.eventDrag.segs) ||
    (props.eventResize && props.eventResize.segs) ||
    (isSelectMirror && props.dateSelectionSegs) ||
    []

  const dateMeta = useMemo(
    () => getDateMeta(props.date, dateEnv, props.dateProfile, props.todayRange),
    [props.date, dateEnv, props.dateProfile, props.todayRange],
  )
  const sortedFgSegs = useMemo(
    () => sortEventSegs(props.fgEventSegs, options.eventOrder),
    [props.fgEventSegs, options.eventOrder],
  )

  const baseClassName = joinClassNames(
    classNames.borderlessY,
    classNames.borderlessEnd,
    !props.borderStart && classNames.borderlessStart,
    props.width == null && classNames.liquid,
    classNames.rel, // origin for abs-positioned children within
    classNames.z1, // get above slots
  )

  const baseStyle = {
    width: props.width,
  }

  const isStack = computeTimeGridPrintMode(props.forPrint, options.eventPrintLayout) === 'stack'
  const renderProps: DayLaneInfo = {
    ...dateMeta,
    ...props.renderProps,
    isStack,
    isNarrow: props.isNarrow,
    isMajor: props.isMajor,
    view: context.viewApi,
  }

  if (dateMeta.isDisabled) {
    return (
      <div
        role='cell'
        aria-disabled
        className={joinClassNames(
          generateClassName(options.dayLaneClass, renderProps),
          baseClassName,
        )}
        style={baseStyle}
      />
    )
  }

  const innerClassName = joinClassNames(
    generateClassName(options.dayLaneInnerClass, renderProps),
    !isStack && classNames.fill,
    classNames.z1, // scope event z-indexes
  )

  return (
    <TimeGridColLane
      attrs={{
        ...props.attrs,
        role: 'cell',
        ...(dateMeta.isToday ? { 'aria-current': 'date' } : {}),
        'data-date': formatDayString(props.date),
      }}
      className={baseClassName}
      style={baseStyle}
      renderProps={renderProps}
    >
      {renderFillSegs(props, options, props.businessHourSegs, 'non-business')}
      {renderFillSegs(props, options, props.bgEventSegs, 'bg-event')}
      {renderFillSegs(props, options, props.dateSelectionSegs, 'highlight')}
      <div
        // events and more-links are list items
        role={sortedFgSegs.length ? 'list' : undefined}
        className={innerClassName}
      >
        {renderFgSegs(
          props,
          options,
          isStack,
          sortedFgSegs,
          /* isMirror = */ false,
        )}
      </div>
      {Boolean(mirrorSegs.length) && (
        // but only show it when there are actual mirror events, to avoid blocking clicks
        <div
          className={innerClassName}
        >
          {renderFgSegs(
            props,
            options,
            isStack,
            mirrorSegs,
            /* isMirror = */ true,
          )}
        </div>
      )}
      {renderNowIndicator(props, isStack)}
    </TimeGridColLane>
  )
})

function renderFgSegs(
  props: TimeGridColProps,
  options: ViewOptionsRefined,
  isStack: boolean,
  sortedFgSegs: (TimeGridRange & EventRangeProps)[],
  isMirror: boolean,
) {
  if (isStack) {
    return renderPlainFgSegs(sortedFgSegs, props, isMirror)
  }

  if (isMirror) {
    return renderPositionedMirrorSegs(props, options, sortedFgSegs)
  }

  return renderPositionedFgSegs(props, options, sortedFgSegs)
}

function renderPositionedFgSegs(
  props: TimeGridColProps,
  options: ViewOptionsRefined,
  segs: (TimeGridRange & EventRangeProps)[], // needs to be sorted
) {
  let { eventMaxStack, eventOrderStrict } = options

  let segVerticals = computeSegVerticals(props, options, segs)
  let { placements, hiddenGroups } = buildTimeGridSegPlacements(
    segs,
    segVerticals,
    eventOrderStrict,
    eventMaxStack,
  )

  return (
    <>
      {placements.map((placement) => renderPositionedSeg(
        props,
        placement.seg,
        placement.segVertical,
        computeSegHStyle(options, placement),
        placement.stackDepth,
        /* isMirror = */ false,
      ))}
      {renderHiddenGroups(props, hiddenGroups)}
    </>
  )
}

// Mirrors bypass normal-event admission so limits cannot hide them or create more links.
function renderPositionedMirrorSegs(
  props: TimeGridColProps,
  options: ViewOptionsRefined,
  segs: (TimeGridRange & EventRangeProps)[],
) {
  let segVerticals = computeSegVerticals(props, options, segs)

  return segs.map((seg, index) => renderPositionedSeg(
    props,
    seg,
    segVerticals[index] || {},
    { left: 0, right: 0, zIndex: 0 }, // full column width
    /* level = */ 0,
    /* isMirror = */ true,
  ))
}

function renderPositionedSeg(
  props: TimeGridColProps,
  seg: TimeGridRange & EventRangeProps,
  segVertical: Partial<TimeGridSegVertical>,
  hStyle: { zIndex: number, [prop: string]: any },
  level: number,
  isMirror: boolean,
) {
  let { eventRange } = seg
  let { instanceId } = eventRange.instance // guaranteed because it's an fg event

  let isSelected = instanceId === props.eventSelection
  if (isSelected) {
    hStyle.zIndex += 1000 // HACK: relies on hardcoded z-index offset; fragile if stacking context changes
  }

  let isDragging = Boolean(props.eventDrag && props.eventDrag.affectedInstances[instanceId])
  let isResizing = Boolean(props.eventResize && props.eventResize.affectedInstances[instanceId])
  let isInvisible = !isMirror && (isDragging || isResizing)

  return (
    <div
      role={isMirror ? undefined : 'listitem'}
      // we would have used classNames.fill, but multi-page spanning breaks in Firefox
      // we would have used height:100%, but multi-page spanning breaks in Safari
      className={joinClassNames(classNames.abs, classNames.flexCol)}
      key={instanceId}
      style={{
        visibility: isInvisible ? 'hidden' : undefined,
        top: segVertical.start,
        height: segVertical.size,
        ...hStyle,
      }}
    >
      <TimeGridEvent
        eventRange={eventRange}
        slicedStart={seg.startDate}
        slicedEnd={seg.endDate}
        isStart={seg.isStart}
        isEnd={seg.isEnd}
        isDragging={isDragging}
        isResizing={isResizing}
        isMirror={isMirror}
        isSelected={isSelected}
        level={level}
        isNarrow={props.isNarrow}
        isShort={segVertical.isShort || false}
        isLiquid
        renderProps={props.renderProps}
        {...getEventRangeMeta(eventRange, props.todayRange, props.nowDate, props.nowMs)}
      />
    </div>
  )
}

/*
A pixel floor is only meaningful against a real slat height, so it stays off
while the height is assumed. See ESTIMATED_SLAT_HEIGHT for why, and for what
the assumed pass does and does not guarantee.
*/
// TODO: memoize this?
function computeSegVerticals(
  props: TimeGridColProps,
  options: ViewOptionsRefined,
  segs: (TimeGridRange & EventRangeProps)[],
) {
  let isMeasured = props.slatHeight != null

  return computeFgSegVerticals(
    segs,
    props.dateProfile,
    props.date,
    props.slatCnt,
    props.slatHeight ?? ESTIMATED_SLAT_HEIGHT,
    isMeasured ? options.eventMinHeight : undefined,
    options.eventShortHeight,
  )
}

/*
NOTE: a group's coordinates come from computeFgSegVerticals, so eventMinHeight
has already been applied to the segs it was formed from
*/
function renderHiddenGroups(props: TimeGridColProps, hiddenGroups: TimeGridSegHiddenGroup[]) {
  let { dateSpanProps, renderProps, dateProfile, todayRange, nowDate, nowMs, eventSelection, eventDrag, eventResize, isNarrow, isMicro } = props

  return (
    <>
      {hiddenGroups.map((hiddenGroup) => {
        return (
          <TimeGridMoreLink
            key={hiddenGroup.key}
            hiddenSegs={hiddenGroup.segs}
            top={hiddenGroup.start}
            height={hiddenGroup.end - hiddenGroup.start}
            isNarrow={isNarrow}
            isMicro={isMicro}
            dateSpanProps={dateSpanProps}
            renderProps={renderProps}
            dateProfile={dateProfile}
            todayRange={todayRange}
            nowDate={nowDate}
            nowMs={nowMs}
            eventSelection={eventSelection}
            eventDrag={eventDrag}
            eventResize={eventResize}
          />
        )
      })}
    </>
  )
}

function renderFillSegs(
  props: TimeGridColProps,
  options: ViewOptionsRefined,
  segs: (TimeGridRange & EventRangeProps)[],
  fillType: string,
) {
  let segVerticals = computeSegVerticals(props, options, segs)

  return (
    <>
      {segs.map((seg, index) => {
        const { eventRange } = seg
        const segVertical: Partial<TimeGridSegVertical> = segVerticals[index] || {}

        return (
          <div
            key={buildEventRangeKey(eventRange)}
            aria-hidden // fills, including bg events, are decorative. hidden from screen readers
            className={classNames.fillX}
            style={{
              top: segVertical.start,
              height: segVertical.size,

              // HACK to get bg fills to overlap cell-start border
              // which matches how dayGrid looks,
              // which is important because all-day background events, in TimeGrid,
              // will render on both at the same time
              marginInlineStart: -1,
            }}
          >
            {fillType === 'bg-event' ?
              <BgEvent
                eventRange={eventRange}
                isStart={seg.isStart}
                isEnd={seg.isEnd}
                isNarrow={props.isNarrow}
                isShort={segVertical.isShort || false}
                isVertical={true}
                renderProps={props.renderProps}
                {...getEventRangeMeta(eventRange, props.todayRange, props.nowDate, props.nowMs)}
              /> :
              renderFill(fillType, options)}
          </div>
        )
      })}
    </>
  )
}

function renderNowIndicator(props: TimeGridColProps, isStack: boolean) {
  if (props.forPrint || isStack) {
    return
  }

  return props.nowIndicatorSegs.map((seg, i) => (
    <TimeGridNowIndicatorLine
      key={i}
      nowDate={seg.startDate}
      dayDate={props.date}
      dateProfile={props.dateProfile}
      totalHeight={props.slatHeight != null ? props.slatHeight * props.slatCnt : undefined}
      showDot={seg.showDot ?? true}
    />
  ))
}

/*
TODO: eventually move to width, not left+right
*/
function computeSegHStyle(options: ViewOptionsRefined, segRect: TimeGridSegPlacement) {
  let shouldOverlap = options.slotEventOverlap
  let nearCoord = segRect.levelCoord // the left side if LTR. the right side if RTL. floating-point
  let farCoord = segRect.levelCoord + segRect.thickness // the right side if LTR. the left side if RTL. floating-point

  if (shouldOverlap) {
    // double the width, but don't go beyond the maximum forward coordinate (1.0)
    farCoord = Math.min(1, nearCoord + (farCoord - nearCoord) * 2)
  }

  let props = {
    zIndex: segRect.stackDepth + 1, // convert from 0-base to 1-based
    insetInlineStart: fracToCssDim(nearCoord),
    insetInlineEnd: fracToCssDim(1 - farCoord),
    marginInlineEnd: undefined,
  }

  if (shouldOverlap && segRect.stackForward) {
    // add padding to the edge so that forward stacked events don't cover the resizer's icon
    props.marginInlineEnd = 10 * 2 // 10 is a guesstimate of the icon's width
  }

  return props
}

interface TimeGridColLaneProps {
  attrs: Record<string, any>
  className: string
  style: { width: number | undefined }
  renderProps: DayLaneInfo
  children: ReactNode
}

// the day lane's element, with its dayLane* render hooks. only for enabled days
function TimeGridColLane({ attrs, className, style, renderProps, children }: TimeGridColLaneProps) {
  const { options } = useViewContext()
  const renderHookEl = useRenderHookEl({
    classGenerator: options.dayLaneClass,
    didMount: options.dayLaneDidMount,
    willUnmount: options.dayLaneWillUnmount,
    renderProps,
  })

  return (
    <div
      {...attrs}
      ref={renderHookEl.ref}
      className={joinClassNames(renderHookEl.className, className, attrs.className)}
      style={style}
    >{children}</div>
  )
}

export function renderPlainFgSegs(
  sortedFgSegs: (TimeGridRange & EventRangeProps)[],
  { todayRange, nowDate, nowMs, eventSelection, eventDrag, eventResize, renderProps }: {
    todayRange: DateRange
    nowDate: DateMarker
    nowMs?: number
    eventSelection: string
    eventDrag: EventSegUiInteractionState<TimeGridRange> | null
    eventResize: EventSegUiInteractionState<TimeGridRange> | null
    renderProps?: Dictionary
  },
  isMirror: boolean,
) {
  return (
    <>
      {sortedFgSegs.map((seg) => {
        let { eventRange } = seg
        let { instanceId } = eventRange.instance
        let isDragging = Boolean(eventDrag && eventDrag.affectedInstances[instanceId])
        let isResizing = Boolean(eventResize && eventResize.affectedInstances[instanceId])
        let isInvisible = isDragging || isResizing

        return (
          <div
            key={instanceId}
            role={isMirror ? undefined : 'listitem'}
            className={classNames.breakInsideAvoid}
            style={{ visibility: isInvisible ? 'hidden' : undefined }}
          >
            <TimeGridEvent
              eventRange={eventRange}
              slicedStart={seg.startDate}
              slicedEnd={seg.endDate}
              isStart={seg.isStart}
              isEnd={seg.isEnd}
              isDragging={isDragging}
              isResizing={isResizing}
              isMirror={isMirror}
              isSelected={instanceId === eventSelection}
              level={0}
              isShort={false}
              isNarrow={false}
              disableResizing
              renderProps={renderProps}
              {...getEventRangeMeta(eventRange, todayRange, nowDate, nowMs)}
            />
          </div>
        )
      })}
    </>
  )
}
