import { DateComponent } from '../component/DateComponent.js'
import { DateRange } from '../datelib/date-range.js'
import { DateMarker } from '../datelib/marker.js'
import { DateProfile } from '../DateProfileGenerator.js'
import { Hit } from '../interactions/hit.js'
import { Dictionary } from '../options.js'
import { createElement, ComponentChildren, ComponentChild, createPortal, createRef } from '../preact.js'
import { getDateMeta } from '../component-util/date-rendering.js'
import { formatDayString } from '../datelib/formatting-utils.js'
import { memoize } from '../util/memoize.js'
import { generateClassName } from '../content-inject/ContentContainer.js'
import { ContentContainer } from '../content-inject/ContentContainer.js'
import { DayCellData, DayHeaderData } from '../api/structs.js'
import { buildNavLinkAttrs } from './nav-link.js'
import classNames from '../internal-classnames.js'
import { joinArrayishClassNames, joinClassNames } from '../util/html.js'
import { applyStyle, computeElIsRtl, getAppendableRoot, getEventTargetViaRoot, getUniqueDomId } from '../util/dom-manip.js'
import { createAriaClickAttrs } from '../util/dom-event.js'
import { computeClippedClientRect } from '../util/dom-geom.js'
import { findDayNumberText, findWeekdayText, WEEKDAY_ONLY_FORMAT, DAY_NUMBER_ONLY_FORMAT } from '../util/date-format.js'

export interface MorePopoverProps {
  id: string
  startDate: DateMarker
  endDate: DateMarker
  dateProfile: DateProfile
  alignEl: HTMLElement
  alignParentTop?: string
  forceTimed?: boolean
  todayRange: DateRange
  dateSpanProps: Dictionary
  children: ComponentChildren
  onClose?: () => void
}

const PADDING_FROM_VIEWPORT = 10
const ROW_BORDER_WIDTH = 1

export class MorePopover extends DateComponent<MorePopoverProps> {
  // memo
  private getDateMeta = memoize(getDateMeta)

  // ref
  private rootEl: HTMLElement
  private closeRef = createRef<HTMLDivElement>()
  private focusStartRef = createRef<HTMLDivElement>()
  private focusEndRef = createRef<HTMLDivElement>()

  // internal
  private titleId = getUniqueDomId()

  render() {
    let { props, context } = this
    let { options, dateEnv, viewApi } = context
    let { startDate, todayRange, dateProfile } = props
    let dateMeta = this.getDateMeta(startDate, dateEnv, dateProfile, todayRange)
    let [text, textParts] = dateEnv.format(startDate, options.dayPopoverFormat)

    function getWeekdayText() {
      return findWeekdayText(textParts) ||
        dateEnv.format(startDate, WEEKDAY_ONLY_FORMAT)[0]
    }

    function getDayNumberText() {
      return findDayNumberText(textParts) ||
        dateEnv.format(startDate, DAY_NUMBER_ONLY_FORMAT)[0]
    }

    const hasNavLink = options.navLinks
    const dayHeaderRenderProps: DayHeaderData = {
      ...dateMeta,
      isMajor: false,
      isNarrow: false,
      isSticky: false,
      inPopover: true,
      level: 0,
      hasNavLink,
      text,
      textParts,
      get weekdayText() { return getWeekdayText() },
      get dayNumberText() { return getDayNumberText() },
      view: viewApi,
      // TODO: should know about the resource!
    }
    const dayCellRenderProps: DayCellData = {
      ...dateMeta,
      isMajor: false,
      isNarrow: false,
      inPopover: true,
      hasNavLink,
      hasLabel: false,
      hasMonthLabel: false,
      get dayNumberText() { return getDayNumberText() },
      view: viewApi,
      text: '',
      textParts: [],
      options: { businessHours: Boolean(options.businessHours) },
    }

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
        aria-labelledby={this.titleId}
        className={joinArrayishClassNames(
          options.popoverClass,
          classNames.popoverZ,
          classNames.abs,
          classNames.internalPopover,
        )}
        // HACK because of portal
        dir={isRtl ? 'rtl' : undefined}
        ref={this.handleRootEl}
      >
        <div
          tabIndex={0}
          style={{ outline: 'none' }} // TODO: className?
          ref={this.focusStartRef}
        />
        <div
          className={joinClassNames(
            generateClassName(options.dayHeaderClass, dayHeaderRenderProps),
            classNames.flexCol,
            classNames.borderOnlyB,
            align === 'center' ? classNames.alignCenter :
              align === 'end' ? classNames.alignEnd :
                classNames.alignStart,
          )}
        >
          <div>{/* be similar to DayGridHeaderCell */}
            <ContentContainer
              tag="div"
              attrs={{
                id: this.titleId,
                ...(
                  hasNavLink
                    ? buildNavLinkAttrs(context, startDate, undefined, fullDateStr)
                    : {}
                ),
              }}
              generatorName="dayHeaderContent"
              renderProps={dayHeaderRenderProps}
              customGenerator={options.dayHeaderContent}
              defaultGenerator={renderText}
              classNameGenerator={options.dayHeaderInnerClass}
              didMount={options.dayHeaderDidMount}
              willUnmount={options.dayHeaderWillUnmount}
            />
          </div>
          <ContentContainer
            tag='button'
            attrs={{
              'aria-label': options.closeHint,
              ...createAriaClickAttrs(this.handleClose)
            }}
            elRef={this.closeRef}
            className={joinArrayishClassNames(
              options.popoverCloseClass,
              classNames.cursorPointer,
              classNames.flexRow,
            )}
            renderProps={{}}
            customGenerator={options.popoverCloseContent}
            generatorName='popoverCloseContent'
          />
        </div>
        <div
          className={joinClassNames(
            generateClassName(options.dayCellClass, dayCellRenderProps),
            classNames.borderNone,
          )}
        >
          <div className={generateClassName(options.dayCellInnerClass, dayCellRenderProps)}>
            {props.children}
          </div>
        </div>
        <div
          tabIndex={0}
          style={{ outline: 'none' }} // TODO: className?
          ref={this.focusEndRef}
        />
      </div>,
      getAppendableRoot(props.alignEl),
    )
  }

  handleRootEl = (rootEl: HTMLElement | null) => {
    this.rootEl = rootEl

    if (rootEl) {
      this.context.registerInteractiveComponent(this, {
        el: rootEl,
        useEventCenter: false,
      })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  queryHit(isRtl: boolean, positionLeft: number, positionTop: number, elWidth: number, elHeight: number): Hit {
    let { rootEl, props } = this

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
        getDayEl: () => rootEl,
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
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleDocumentMouseDown)
    document.addEventListener('keydown', this.handleDocumentKeyDown)

    this.focusStartRef.current.addEventListener('focus', this.handleClose)
    this.focusEndRef.current.addEventListener('focus', this.handleClose)
    this.closeRef.current.focus({ preventScroll: true })

    this.updateSize()
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleDocumentMouseDown)
    document.removeEventListener('keydown', this.handleDocumentKeyDown)

    this.focusStartRef.current.removeEventListener('focus', this.handleClose)
    this.focusEndRef.current.removeEventListener('focus', this.handleClose)
  }

  // Triggered when the user clicks *anywhere* in the document, for the autoHide feature
  handleDocumentMouseDown = (ev) => {
    // only hide the popover if the click happened outside the popover
    const target = getEventTargetViaRoot(ev) as HTMLElement
    if (!this.rootEl.contains(target)) {
      this.handleClose()
    }
  }

  handleDocumentKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      this.handleClose()
    }
  }

  // for many different close techniques
  // cannot accept params because might receive a browser Event
  handleClose = () => {
    let { onClose } = this.props
    if (onClose) {
      onClose()
    }
  }

  private updateSize() {
    let { alignEl, alignParentTop } = this.props
    let { rootEl } = this

    const isRtl = computeElIsRtl(alignEl)
    const alignmentRect = computeClippedClientRect(alignEl)

    if (alignmentRect) {
      let popoverDims = rootEl.getBoundingClientRect()

      // position relative to viewport
      let popoverTop = alignParentTop
        // HACK: subtract 1 for DayGrid, which has borders on row-bottom. Only view that uses alignParentTop
        ? alignEl.closest(alignParentTop).getBoundingClientRect().top - ROW_BORDER_WIDTH
        : alignmentRect.top

      let popoverLeft = isRtl ? alignmentRect.right - popoverDims.width : alignmentRect.left

      // constrain
      popoverTop = Math.max(popoverTop, PADDING_FROM_VIEWPORT)
      popoverLeft = Math.min(popoverLeft, document.documentElement.clientWidth - PADDING_FROM_VIEWPORT - popoverDims.width)
      popoverLeft = Math.max(popoverLeft, PADDING_FROM_VIEWPORT)

      let rootNode = getAppendableRoot(alignEl)
      let origin = (rootNode as HTMLElement).getBoundingClientRect
        ? (rootNode as HTMLElement).getBoundingClientRect()
        : (rootNode as ShadowRoot).firstElementChild.getBoundingClientRect() // yuck

      applyStyle(rootEl, {
        top: popoverTop - origin.top,
        left: popoverLeft - origin.left,
      })
    }
  }
}

// TODO: DRY
function renderText(renderProps: DayHeaderData): ComponentChild {
  return renderProps.text
}
