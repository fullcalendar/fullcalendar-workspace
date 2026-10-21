import { DateRange, DateMarker, formatDayString, joinDateTimeFormatParts } from '@full-ui/headless-calendar'
import { DateProfile } from '../date-profile/DateProfileGenerator'
import { Hit } from '../interactions/hit'
import { Dictionary } from '../util/object'
import { type ReactNode, memo, useLayoutEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getDateMeta } from '../date-profile/date-meta'
import { generateClassName } from '../render-hook/render-hook-types'
import { CustomContent } from '../render-hook/CustomContent'
import { useViewContext } from '../context/useViewContext'
import { useRenderHookEl } from '../render-hook/useRenderHookEl'
import { useHitTarget } from '../interactions/useHitTarget'
import { useStableCallback } from '../hooks/useStableCallback'
import { DayCellInfo, DayHeaderInfo } from '../api/public-types'
import classNames from '../styles.module.css'
import { ROW_BORDER_WIDTH } from '../layout/border-widths'
import { joinClassNames } from '../util/html'
import { applyStyle, computeElIsRtl, getAppendableRoot, getEventTargetViaRoot } from '../util/dom-manip'
import { createAriaClickAttrs } from '../util/dom-event'
import { computeClippedClientRect } from '../util/dom-geom'
import { findDayNumberText, findMonthText, findWeekdayText } from '../util/date-format'

export interface MorePopoverProps {
  id: string
  titleId: string
  startDate: DateMarker
  endDate: DateMarker
  dateProfile: DateProfile
  alignEl: HTMLElement
  alignParentTop?: string
  forceTimed?: boolean
  todayRange: DateRange
  dateSpanProps: Dictionary
  renderProps?: Dictionary // so can include a resource
  children: ReactNode
  onClose?: () => void
}

const SPACE_FROM_VIEWPORT = 10

const FOCUS_GUARD_STYLE = { outline: 'none' } // TODO: className?
const CLOSE_RENDER_PROPS = {}

export const MorePopover = memo(function MorePopover(props: MorePopoverProps) {
  let context = useViewContext()
  let { options, dateEnv, viewApi } = context
  let { startDate, todayRange, dateProfile } = props
  let dateMeta = useMemo(
    () => getDateMeta(startDate, dateEnv, dateProfile, todayRange),
    [startDate, dateEnv, dateProfile, todayRange],
  )
  let textParts = dateEnv.formatToParts(startDate, options.popoverFormat)
  let text = joinDateTimeFormatParts(textParts)

  const rootElRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLElement | null>(null)
  const focusStartRef = useRef<HTMLDivElement | null>(null)
  const focusEndRef = useRef<HTMLDivElement | null>(null)

  const dayHeaderRenderProps: DayHeaderInfo = {
    ...props.renderProps, // first, so built-in props take precedence
    ...dateMeta,
    isMajor: false,
    isNarrow: false,
    isSticky: false,
    inPopover: true,
    level: 0,
    hasNavLink: false,
    text,
    textParts,
    get weekdayText() { return findWeekdayText(textParts) },
    get dayNumberText() { return findDayNumberText(textParts) },
    view: viewApi,
  }
  const dayCellRenderProps: DayCellInfo = {
    ...props.renderProps, // first, so built-in props take precedence
    ...dateMeta,
    isMajor: false,
    isNarrow: false,
    inPopover: true,
    hasNavLink: false,
    get weekdayText() { return findWeekdayText(textParts) },
    get dayNumberText() { return findDayNumberText(textParts) },
    get monthText() { return findMonthText(textParts) },
    view: viewApi,
    text: '',
    textParts: [],
    options: { businessHours: Boolean(options.businessHours) },
  }
  const dayHeaderInnerEl = useRenderHookEl({
    classGenerator: options.dayHeaderInnerClass,
    didMount: options.dayHeaderDidMount,
    willUnmount: options.dayHeaderWillUnmount,
    renderProps: dayHeaderRenderProps,
  })

  useHitTarget(rootElRef, {
    useEventCenter: false,
    queryHit(isRtl, positionLeft, positionTop, elWidth, elHeight): Hit {
      if (
        positionLeft >= 0 && positionLeft < elWidth &&
        positionTop >= 0 && positionTop < elHeight
      ) {
        return {
          dateProfile: props.dateProfile,
          dateSpan: {
            allDay: !props.forceTimed,
            range: {
              start: props.startDate,
              end: props.endDate,
            },
            ...props.dateSpanProps,
          },
          getDayEl: () => rootElRef.current,
          rect: {
            left: 0,
            top: 0,
            right: elWidth,
            bottom: elHeight,
          },
          layer: 1, // important when comparing with hits from other components
        }
      }

      return null
    },
  })

  // for many different close techniques
  // cannot accept params because might receive a browser Event
  const handleClose = useStableCallback(() => {
    props.onClose?.()
  })

  useLayoutEffect(() => {
    // Triggered when the user clicks *anywhere* in the document, for the autoHide feature
    const handleDocumentMouseDown = (ev: MouseEvent) => {
      // only hide the popover if the click happened outside the popover
      const target = getEventTargetViaRoot(ev) as HTMLElement
      if (!rootElRef.current.contains(target)) {
        handleClose()
      }
    }
    const handleDocumentKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        handleClose()
      }
    }
    const focusStartEl = focusStartRef.current
    const focusEndEl = focusEndRef.current

    document.addEventListener('mousedown', handleDocumentMouseDown)
    document.addEventListener('keydown', handleDocumentKeyDown)
    focusStartEl.addEventListener('focus', handleClose)
    focusEndEl.addEventListener('focus', handleClose)
    closeRef.current.focus({ preventScroll: true })

    updatePopoverPosition(rootElRef.current, props.alignEl, props.alignParentTop)

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown)
      document.removeEventListener('keydown', handleDocumentKeyDown)
      focusStartEl.removeEventListener('focus', handleClose)
      focusEndEl.removeEventListener('focus', handleClose)
    }
  }, [])

  const fullDateStr = formatDayString(startDate)

  /*
  TODO: DRY with TimelineHeaderCell
  */
  const { dayHeaderAlign } = options
  const align =
    typeof dayHeaderAlign === 'function'
      ? dayHeaderAlign({ level: 0, inPopover: true, isNarrow: false })
      : dayHeaderAlign

  const isRtl = computeElIsRtl(props.alignEl)

  return createPortal(
    <div
      data-date={fullDateStr}
      id={props.id}
      role='dialog'
      aria-labelledby={props.titleId}
      className={joinClassNames(
        options.popoverClass,
        classNames.flexCol,
        classNames.popoverZ,
        classNames.abs,
        classNames.borderBoxRoot,
        classNames.internalPopover,
      )}
      style={{
        // positioning is mutated directly in updatePopoverPosition, HOWEVER, we don't want popover to
        // start low on screen because might cause unnecessary scrollbars
        top: 0,
        left: 0,
      }}
      // HACK because of portal
      dir={isRtl ? 'rtl' : undefined}
      data-color-scheme={options.colorScheme || undefined}
      ref={rootElRef}
    >
      <div
        tabIndex={0}
        style={FOCUS_GUARD_STYLE}
        ref={focusStartRef}
      />
      <div
        className={joinClassNames(
          generateClassName(options.dayHeaderClass, dayHeaderRenderProps),
          classNames.flexCol,
          classNames.borderlessX,
          classNames.borderlessTop,
          align === 'center' ? classNames.alignCenter :
            align === 'end' ? classNames.alignEnd :
              classNames.alignStart,
        )}
      >
        <div>{/* be similar to DayGridHeaderCell */}
          <CustomContent
            tag="div"
            attrs={{
              id: props.titleId,
              // NOTE: more-popover never has nav-links
            }}
            className={dayHeaderInnerEl.className}
            elRef={dayHeaderInnerEl.ref}
            generatorName="dayHeaderContent"
            renderProps={dayHeaderRenderProps}
            generator={options.dayHeaderContent}
            fallback={renderText}
          />
        </div>
        <CustomContent
          tag='button'
          attrs={{
            'aria-label': options.closeHint,
            ...createAriaClickAttrs(handleClose),
          }}
          elRef={closeRef}
          className={joinClassNames(
            options.popoverCloseClass,
            classNames.flexRow,
            classNames.cursorPointer,
          )}
          renderProps={CLOSE_RENDER_PROPS}
          generator={options.popoverCloseContent}
          generatorName='popoverCloseContent'
        />
      </div>
      <div
        className={joinClassNames(
          generateClassName(options.dayCellClass, dayCellRenderProps),
          classNames.flexCol,
          classNames.borderless,
        )}
      >
        <div
          role='list' // children are list items
          className={generateClassName(options.dayCellInnerClass, dayCellRenderProps)}
        >
          {props.children}
        </div>
      </div>
      <div
        tabIndex={0}
        style={FOCUS_GUARD_STYLE}
        ref={focusEndRef}
      />
    </div>,
    getAppendableRoot(props.alignEl) as HTMLElement,
  )
})

function updatePopoverPosition(popoverEl: HTMLElement, alignEl: HTMLElement, alignParentTop: string | undefined) {
  const isRtl = computeElIsRtl(alignEl)

  // position relative to viewport
  const alignmentRect = computeClippedClientRect(alignEl)

  if (alignmentRect) {
    let popoverDims = popoverEl.getBoundingClientRect()

    // position relative to viewport
    let popoverVPTop = alignParentTop
      // HACK: subtract 1 for DayGrid, which has borders on row-bottom. Only view that uses alignParentTop
      ? alignEl.closest(alignParentTop).getBoundingClientRect().top - ROW_BORDER_WIDTH
      : alignmentRect.top
    let popoverVPLeft = isRtl ? alignmentRect.right - popoverDims.width : alignmentRect.left

    // constrain
    popoverVPTop = Math.max(popoverVPTop, SPACE_FROM_VIEWPORT)
    popoverVPLeft = Math.min(popoverVPLeft, document.documentElement.clientWidth - SPACE_FROM_VIEWPORT - popoverDims.width)
    popoverVPLeft = Math.max(popoverVPLeft, SPACE_FROM_VIEWPORT)

    const { offsetParent } = popoverEl

    // final popover position, relative to offsetParent
    let top: number
    let left: number

    // TODO: account for RTL
    if (!offsetParent || offsetParent === document.body) {
      top = popoverVPTop + window.scrollY
      left = popoverVPLeft + window.scrollX
    } else {
      const offsetParentRect = offsetParent.getBoundingClientRect()
      top = popoverVPTop - offsetParentRect.top + offsetParent.scrollTop
      left = popoverVPLeft - offsetParentRect.left + offsetParent.scrollLeft
    }

    applyStyle(popoverEl, { top, left })
  }
}

// TODO: DRY
function renderText(renderProps: DayHeaderInfo): ReactNode {
  return renderProps.text
}
