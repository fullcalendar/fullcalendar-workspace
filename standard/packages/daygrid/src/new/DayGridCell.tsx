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
import { TableSeg } from '../TableSeg.js'

export interface DayGridCellProps {
  dateProfile: DateProfile
  todayRange: DateRange
  date: DateMarker
  showDayNumber: boolean

  // content
  segs: TableSeg[] // for +more link popover content
  hiddenSegs: TableSeg[] // "
  fgHeightFixed: boolean
  fg: ComponentChildren
  bg: ComponentChildren
  eventDrag: EventSegUiInteractionState | null
  eventResize: EventSegUiInteractionState | null
  eventSelection: string

  // render hooks
  extraRenderProps?: Dictionary
  extraDateSpan?: Dictionary
  extraDataAttrs?: Dictionary
  extraClassNames?: string[]

  // dimensions
  fgHeight: number | undefined
  width?: number

  // refs
  innerHeightRef?: Ref<number> // for resource-daygrid row-height syncing
  headerHeightRef?: Ref<number> // for event-positioning top-origin
}

export class DayGridCell extends DateComponent<DayGridCellProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()
  private headerWrapElRef = createRef<HTMLDivElement>()

  // internal
  private detachInnerElSize?: () => void
  private detachTopElSize?: () => void

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
          'fcnew-daygrid-cell',
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
              'fcnew-daygrid-cell-inner',
              props.fgHeightFixed ? 'fcnew-daygrid-cell-inner-liquid' : ''
            ].join(' ')}
          >
            <div ref={this.headerWrapElRef} className="fcnew-daygrid-cell-header-wrap">
              {!renderProps.isDisabled && (props.showDayNumber || hasCustomDayCellContent(options)) && (
                <div className="fcnew-daygrid-cell-header">
                  <InnerContent
                    elTag="a"
                    elClasses={[
                      'fcnew-daygrid-cell-number',
                      isMonthStart && 'fcnew-daygrid-month-start',
                    ]}
                    elAttrs={buildNavLinkAttrs(context, props.date)}
                  />
                </div>
              )}
            </div>
            <div
              className="fcnew-daygrid-cell-main"
              style={{ height: props.fgHeight }}
            >
              {props.fg}
            </div>
            <div className="fcnew-daygrid-cell-footer">
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

    this.detachInnerElSize = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
    this.detachTopElSize = watchHeight(headerWrapEl, (height) => {
      setRef(this.props.headerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.detachInnerElSize()
    this.detachTopElSize()

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
