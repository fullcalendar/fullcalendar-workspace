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
  setRef,
  SlicedCoordRange,
  joinClassNames,
  watchSize,
  isDimsEqual,
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
  className?: string

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
  private bodyElRef = createRef<HTMLDivElement>()

  // internal
  private headerHeight?: number
  private disconnectBodyHeight?: () => void

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
          'fc-daygrid-day fc-flex-col',
          props.borderStart && 'fc-border-s',
          props.width != null ? '' : 'fc-liquid',
        )}
        attrs={{
          ...props.attrs,
          role: 'gridcell',
        }}
        style={{
          width: props.width
        }}
        elRef={this.rootElRef}
        renderProps={props.renderProps}
        defaultGenerator={renderTopInner}
        date={props.date}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        showDayNumber={props.showDayNumber}
        isMonthStart={isMonthStart}
      >
        {(InnerContent, renderProps) => (
          <Fragment>
            {!renderProps.isDisabled && (props.showDayNumber || hasCustomDayCellContent(options)) && (
              <div className="fc-daygrid-day-header">
                <InnerContent
                  tag="a"
                  attrs={buildNavLinkAttrs(context, props.date)}
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
              ref={this.bodyElRef}
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

  componentDidMount(): void {
    const bodyEl = this.bodyElRef.current

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

  componentWillUnmount(): void {
    this.disconnectBodyHeight()

    const { props } = this
    setRef(props.headerHeightRef, null)
    setRef(props.mainHeightRef, null)
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
