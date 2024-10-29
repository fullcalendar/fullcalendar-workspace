import { DayCellContentArg } from '@fullcalendar/core'
import {
  DateMarker,
  DateComponent,
  DateRange,
  buildNavLinkAttrs,
  DayCellContainer,
  DateProfile,
  Dictionary,
  EventSegUiInteractionState,
  hasCustomDayCellContent,
  addMs,
  DateEnv,
  watchHeight,
  setRef,
  SlicedCoordRange,
  joinClassNames,
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

  // content
  segs: DayRowEventRangePart[] // for +more link popover content
  hiddenSegs: DayRowEventRange[] // "
  fgLiquidHeight: boolean
  fg: ComponentChildren
  bg: ComponentChildren
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
  innerHeightRef?: Ref<number> // for resource-daygrid row-height syncing
  headerHeightRef?: Ref<number> // for event-positioning top-origin
}

export class DayGridCell extends DateComponent<DayGridCellProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private detachInnerHeight?: () => void
  private detachHeaderHeight?: () => void

  render() {
    let { props, context } = this
    let { options, dateEnv } = context

    // TODO: memoize this
    const isMonthStart = props.showDayNumber &&
      shouldDisplayMonthStart(props.date, props.dateProfile.currentRange, dateEnv)

    return (
      <DayCellContainer
        tag="div"
        className={joinClassNames(
          props.className,
          'fc-daygrid-cell fc-cell fc-flex-column',
          props.width != null ? '' : 'fc-liquid',
        )}
        attrs={{
          ...props.attrs,
          role: 'gridcell',
        }}
        style={{
          width: props.width
        }}
        renderProps={props.renderProps}
        defaultGenerator={renderTopInner}
        date={props.date}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        showDayNumber={props.showDayNumber}
        isMonthStart={isMonthStart}
      >
        {(InnerContent, renderProps) => (
          <div
            ref={this.innerElRef}
            className={joinClassNames(
              'fc-daygrid-cell-inner',
              props.isTall && 'fc-daygrid-cell-inner-tall',
              props.fgLiquidHeight && 'fc-liquid',
            )}
          >
            {!renderProps.isDisabled && (props.showDayNumber || hasCustomDayCellContent(options)) && (
              <div ref={this.handleHeaderEl} className="fc-daygrid-cell-header">
                <InnerContent
                  tag="a"
                  attrs={buildNavLinkAttrs(context, props.date)}
                  className={joinClassNames(
                    'fc-daygrid-cell-number',
                    isMonthStart && 'fc-daygrid-month-start',
                  )}
                />
              </div>
            )}
            <div
              className="fc-daygrid-cell-main"
              style={{
                height: props.fgLiquidHeight ? '' : props.fgHeight
              }}
            >
              {props.fg}
            </div>
            <div
              className="fc-daygrid-cell-footer"
              style={
                props.fgLiquidHeight
                  ? { position: 'relative', top: props.fgHeight }
                  : {}
              }
            >
              <DayGridMoreLink
                isBlock={props.isCompact}
                allDayDate={props.date}
                segs={props.segs}
                hiddenSegs={props.hiddenSegs}
                alignmentElRef={this.innerElRef}
                alignGridTop={!props.showDayNumber}
                dateSpanProps={props.dateSpanProps}
                dateProfile={props.dateProfile}
                eventSelection={props.eventSelection}
                eventDrag={props.eventDrag}
                eventResize={props.eventResize}
                todayRange={props.todayRange}
              />
            </div>
            {props.bg}
          </div>
        )}
      </DayCellContainer>
    )
  }

  handleHeaderEl = (headerEl: HTMLElement) => {
    if (this.detachHeaderHeight) {
      this.detachHeaderHeight()
    }
    if (headerEl) {
      this.detachHeaderHeight = watchHeight(headerEl, (headerHeight) => {
        setRef(this.props.headerHeightRef, headerHeight)
      })
    }
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    // TODO: only attach this if refs props present
    this.detachInnerHeight = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.detachInnerHeight()

    setRef(this.props.innerHeightRef, null)
    setRef(this.props.headerHeightRef, null)
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
