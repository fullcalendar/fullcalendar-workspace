import { DayCellContentArg } from '@fullcalendar/core'
import {
  DateMarker,
  DateComponent,
  DateRange,
  DayCellContainer,
  DateProfile,
  Dictionary,
  EventSegUiInteractionState,
  hasCustomDayCellContent,
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
} from '@fullcalendar/core/internal'
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

export interface DayGridCellProps {
  dateProfile: DateProfile
  todayRange: DateRange
  date: DateMarker
  showDayNumber: boolean
  isCompact?: boolean
  isTall?: boolean
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
  className?: string // just semantic className

  // dimensions
  fgHeight: number | undefined
  width?: number | string

  // refs
  headerHeightRef?: Ref<number>
  mainHeightRef?: Ref<number> // will only fire if fgLiquidHeight
}

export class DayGridCell extends DateComponent<DayGridCellProps> {
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

    // TODO: memoize this
    const dateMeta = getDateMeta(props.date, props.todayRange, null, props.dateProfile)

    const baseClassName = joinClassNames(
      'fc-daygrid-day',
      props.borderStart && 'fc-border-s',
      props.width != null ? '' : 'fc-liquid',
      'fc-flex-col',
    )

    if (dateMeta.isDisabled) {
      return (
        <div
          role='gridcell'
          aria-disabled
          className={joinClassNames(baseClassName, 'fc-day-disabled')}
          style={{
            width: props.width
          }}
        />
      )
    }

    const hasDayNumber = props.showDayNumber || hasCustomDayCellContent(options)

    const isNavLink = options.navLinks
    const fullDateStr = buildDateStr(context, props.date)

    return (
      <DayCellContainer
        tag="div"
        className={joinClassNames(
          baseClassName,
          props.className, // semantic classNames
        )}
        attrs={{
          ...props.attrs,
          role: 'gridcell',
          'aria-label': fullDateStr,
        }}
        style={{
          width: props.width
        }}
        elRef={this.rootElRef}
        renderProps={props.renderProps}
        defaultGenerator={renderTopInner}
        date={props.date}
        dateMeta={dateMeta}
        showDayNumber={props.showDayNumber}
        isMonthStart={isMonthStart}
      >
        {(InnerContent) => (
          <Fragment>
            {hasDayNumber && (
              <div className="fc-daygrid-day-header">
                <InnerContent
                  tag='div'
                  attrs={
                    isNavLink
                      ? buildNavLinkAttrs(context, props.date, undefined, fullDateStr)
                      : { 'aria-hidden': true } // label already on cell
                  }
                  className={joinClassNames(
                    'fc-daygrid-day-number',
                    isMonthStart && 'fc-daygrid-month-start',
                  )}
                />
              </div>
            )}
            <div
              className={joinClassNames(
                'fc-daygrid-day-body',
                props.isTall && 'fc-daygrid-day-body-tall',
                props.fgLiquidHeight ? 'fc-liquid' : 'fc-grow',
              )}
              ref={this.handleBodyEl}
            >
              <div className='fc-daygrid-day-events' style={{ height: props.fgHeight }}>
                {props.fg}
              </div>
              <DayGridMoreLink
                isBlock={props.isCompact}
                allDayDate={props.date}
                segs={props.segs}
                hiddenSegs={props.hiddenSegs}
                alignElRef={this.rootElRef}
                alignParentTop={props.showDayNumber ? '[role=row]' : '.fc-view'}
                dateSpanProps={props.dateSpanProps}
                dateProfile={props.dateProfile}
                eventSelection={props.eventSelection}
                eventDrag={props.eventDrag}
                eventResize={props.eventResize}
                todayRange={props.todayRange}
              />
            </div>
          </Fragment>
        )}
      </DayCellContainer>
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

function renderTopInner(props: DayCellContentArg): ComponentChild {
  return props.dayNumberText || <Fragment>&nbsp;</Fragment>
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
