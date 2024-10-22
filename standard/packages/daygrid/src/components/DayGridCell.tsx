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
  extraRenderProps?: Dictionary
  extraDateSpan?: Dictionary
  extraDataAttrs?: Dictionary
  extraClassNames?: string[]

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
  private headerWrapElRef = createRef<HTMLDivElement>()

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
        elTag="div"
        elClasses={[
          'fc-daygrid-cell',
          'fc-cell',
          props.width != null ? '' : 'fc-liquid',
          'fc-flex-column',
          ...(props.extraClassNames || []),
        ]}
        elAttrs={{
          ...props.extraDataAttrs,
          role: 'gridcell',
        }}
        elStyle={{
          width: props.width
        }}
        extraRenderProps={props.extraRenderProps}
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
            className={[
              'fc-daygrid-cell-inner',
              props.fgLiquidHeight ? 'fc-liquid' : ''
            ].join(' ')}
          >
            <div ref={this.headerWrapElRef} className="fc-flex-column">
              {!renderProps.isDisabled && (props.showDayNumber || hasCustomDayCellContent(options)) && (
                <div className="fc-daygrid-cell-header">
                  <InnerContent
                    elTag="a"
                    elAttrs={buildNavLinkAttrs(context, props.date)}
                    elClasses={[
                      'fc-daygrid-cell-number',
                      isMonthStart && 'fc-daygrid-month-start',
                    ]}
                  />
                </div>
              )}
            </div>
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
                allDayDate={props.date}
                segs={props.segs}
                hiddenSegs={props.hiddenSegs}
                alignmentElRef={this.innerElRef}
                alignGridTop={!props.showDayNumber}
                extraDateSpan={props.extraDateSpan}
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

  componentDidMount(): void {
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect
    const headerWrapEl = this.headerWrapElRef.current // "

    // TODO: only attach this if refs props present
    this.detachInnerHeight = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
    this.detachHeaderHeight = watchHeight(headerWrapEl, (height) => {
      setRef(this.props.headerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.detachInnerHeight()
    this.detachHeaderHeight()

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
