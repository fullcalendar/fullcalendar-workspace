import { ViewApi } from '@fullcalendar/core'
import {
  DateMarker,
  DateComponent,
  DateRange,
  DateProfile,
  Dictionary,
  EventSegUiInteractionState,
  addMs,
  DateEnv,
  setRef,
  SlicedCoordRange,
  joinClassNames,
  watchSize,
  isDimsEqual,
  getDateMeta,
  buildDateStr,
  buildNavLinkAttrs,
  memoize,
  DateFormatter,
  DateMeta,
  memoizeObjArg,
  ContentContainer,
  formatDayString,
  generateClassName,
  joinArrayishClassNames,
} from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import {
  Ref,
  ComponentChildren,
  createElement,
  createRef,
  ComponentChild,
  Fragment,
} from '@fullcalendar/core/preact'
import { DayGridMoreLink } from './DayGridMoreLink.js'
import { DayRowEventRange, DayRowEventRangePart } from '../TableSeg.js'
import { DayCellData } from '../structs.js'

export interface DayGridCellProps {
  dateProfile: DateProfile
  todayRange: DateRange
  date: DateMarker
  isMajor: boolean
  showDayNumber: boolean
  isCompact: boolean
  borderStart: boolean

  // content
  segs: DayRowEventRangePart[] // for +more link popover content
  hiddenSegs: DayRowEventRange[] // "
  fgLiquidHeight: boolean
  fg: ComponentChildren
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
  mainHeightRef?: Ref<number> // will only fire if fgLiquidHeight
}

export class DayGridCell extends DateComponent<DayGridCellProps> {
  // memo
  private getDateMeta = memoize(getDateMeta)
  private refineRenderProps = memoizeObjArg(refineRenderProps)

  // ref
  private rootElRef = createRef<HTMLElement>()

  // internal
  private headerHeight?: number
  private disconnectBodyHeight?: () => void

  render() {
    let { props, context } = this
    let { options, dateEnv } = context

    // TODO: memoize this
    const isMonthStart = props.showDayNumber &&
      shouldDisplayMonthStart(props.date, props.dateProfile.currentRange, dateEnv)

    const dateMeta = this.getDateMeta(props.date, dateEnv, props.dateProfile, props.todayRange)

    const baseClassName = joinClassNames(
      props.borderStart ? classNames.borderOnlyS : classNames.borderNone,
      props.width != null ? '' : classNames.liquid,
      classNames.flexCol,
    )

    const renderProps = this.refineRenderProps({
      date: props.date,
      isMajor: props.isMajor,
      isCompact: props.isCompact,
      dateMeta: dateMeta,
      hasLabel: props.showDayNumber,
      hasMonthLabel: isMonthStart,
      renderProps: props.renderProps,
      viewApi: context.viewApi,
      dateEnv: context.dateEnv,
      monthStartFormat: options.monthStartFormat,
      dayCellFormat: options.dayCellFormat,
    })

    if (dateMeta.isDisabled) {
      return (
        <div
          role='gridcell'
          aria-disabled
          className={joinArrayishClassNames(
            generateClassName(options.dayCellClass, renderProps),
            props.className,
            baseClassName,
          )}
          style={{
            width: props.width
          }}
        />
      )
    }

    const isNavLink = options.navLinks
    const fullDateStr = buildDateStr(context, props.date)

    return (
      <ContentContainer
        tag="div"
        elRef={this.rootElRef}
        className={joinClassNames(props.className, baseClassName)}
        attrs={{
          ...props.attrs,
          role: 'gridcell',
          'aria-label': fullDateStr,
          ...(renderProps.isToday ? { 'aria-current': 'date' } : {}),
          'data-date': formatDayString(props.date),
        }}
        style={{
          width: props.width,
        }}
        renderProps={renderProps}
        generatorName="dayCellTopContent" // !!! for top
        customGenerator={options.dayCellTopContent /* !!! for top */}
        defaultGenerator={renderTopInner}
        classNameGenerator={options.dayCellClass}
        didMount={options.dayCellDidMount}
        willUnmount={options.dayCellWillUnmount}
      >
        {(InnerContent) => (
          <Fragment>
            <div
              className={joinClassNames(
                classNames.rel, // puts it above bg-fills
                generateClassName(options.dayCellTopClass, renderProps),
              )}
              // TODO: prevent margins!? for measurements
            >
              {props.showDayNumber && (
                <InnerContent // the dayCellTopContent
                  tag='div'
                  attrs={
                    isNavLink
                      ? buildNavLinkAttrs(context, props.date, undefined, fullDateStr)
                      : { 'aria-hidden': true } // label already on cell
                  }
                  className={generateClassName(options.dayCellTopInnerClass, renderProps)}
                />
              )}
            </div>
            <div
              className={joinClassNames(
                classNames.flexCol,
                props.fgLiquidHeight ? classNames.liquid : classNames.grow,
              )}
              ref={this.handleBodyEl}
            >
              <div
                className={generateClassName(options.dayCellInnerClass, renderProps)}
                style={{ minHeight: props.fgHeight }}
                // TODO: prevent margins/padding!?
              >
                {props.fg}
              </div>
              <DayGridMoreLink
                allDayDate={props.date}
                segs={props.segs}
                hiddenSegs={props.hiddenSegs}
                alignElRef={this.rootElRef}
                alignParentTop={
                  props.showDayNumber
                    ? '[role=row]'
                    : `.${classNames.internalView}`
                }
                dateSpanProps={props.dateSpanProps}
                dateProfile={props.dateProfile}
                eventSelection={props.eventSelection}
                eventDrag={props.eventDrag}
                eventResize={props.eventResize}
                todayRange={props.todayRange}
                isCompact={props.isCompact}
              />
            </div>
            <div
              className={joinClassNames(
                classNames.rel, // puts it above bg-fills
                generateClassName(options.dayCellBottomClass, renderProps),
              )}
            />
          </Fragment>
        )}
      </ContentContainer>
    )
  }

  handleBodyEl = (bodyEl: HTMLElement | null) => {
    if (this.disconnectBodyHeight) {
      this.disconnectBodyHeight()
      this.disconnectBodyHeight = undefined
      setRef(this.props.headerHeightRef, null)
      setRef(this.props.mainHeightRef, null)
    }

    if (bodyEl) {
      // we want to fire on ANY size change, because we do more advanced stuff
      this.disconnectBodyHeight = watchSize(bodyEl, (_bodyWidth, bodyHeight) => {
        const { props } = this
        const mainRect = bodyEl.getBoundingClientRect()
        const rootRect = this.rootElRef.current.getBoundingClientRect()
        const headerHeight = mainRect.top - rootRect.top

        if (!isDimsEqual(this.headerHeight, headerHeight)) {
          this.headerHeight = headerHeight
          setRef(props.headerHeightRef, headerHeight)
        }

        if (props.fgLiquidHeight) {
          setRef(props.mainHeightRef, bodyHeight)
        }
      })
    }
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

function renderTopInner(props: DayCellData): ComponentChild {
  return props.text || <Fragment>&nbsp;</Fragment> // TODO: DRY?
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
  isCompact: boolean
  dateMeta: DateMeta
  dateEnv: DateEnv
  viewApi: ViewApi
  dayCellFormat: DateFormatter
  monthStartFormat: DateFormatter
  hasLabel: boolean
  hasMonthLabel: boolean
  renderProps?: Dictionary // so can include a resource
}

function refineRenderProps(raw: DayCellRenderPropsInput): DayCellData {
  let { date, dateEnv, hasLabel, hasMonthLabel } = raw
  let [text, textParts] = hasLabel
    ? dateEnv.format(date, hasMonthLabel ? raw.monthStartFormat : raw.dayCellFormat)
    : ['', []]

  return {
    ...raw.dateMeta,
    ...raw.renderProps,
    text,
    textParts,
    isMajor: raw.isMajor,
    isCompact: raw.isCompact,
    hasLabel,
    hasMonthLabel,
    view: raw.viewApi,
  }
}
