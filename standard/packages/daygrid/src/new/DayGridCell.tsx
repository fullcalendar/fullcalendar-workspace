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
  moreTop: number
  width?: number

  // refs
  innerElRef?: Ref<HTMLDivElement>
  fgContainerElRef?: Ref<HTMLDivElement>
}

export class DayGridCell extends DateComponent<DayGridCellProps> {
  private rootElRef = createRef<HTMLElement>()

  render() {
    let { props, context, rootElRef } = this
    let { options, dateEnv } = context

    // TODO: memoize this
    const isMonthStart = props.showDayNumber &&
      shouldDisplayMonthStart(props.date, props.dateProfile.currentRange, dateEnv)

    return (
      <DayCellContainer
        elTag="div"
        elClasses={[
          'fcnew-daygrid-day',
          ...(props.extraClassNames || []),
        ]}
        elAttrs={{
          ...props.extraDataAttrs,
          role: 'gridcell',
        }}
        elStyle={{
          width: props.width
        }}
        elRef={rootElRef}
        extraRenderProps={props.extraRenderProps}
        defaultGenerator={renderTopInner}
        date={props.date}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        showDayNumber={props.showDayNumber}
        isMonthStart={isMonthStart}
      >
        {(InnerContent, renderProps) => (
          <div ref={props.innerElRef}>
            {!renderProps.isDisabled &&
              (props.showDayNumber || hasCustomDayCellContent(options)) && (
                <div className="fcnew-daygrid-day-top">
                  <InnerContent
                    elTag="a"
                    elClasses={[
                      'fcnew-daygrid-day-number',
                      isMonthStart && 'fcnew-daygrid-month-start',
                    ]}
                    elAttrs={buildNavLinkAttrs(context, props.date)}
                  />
                </div>
              )}
            <div
              className={[
                "fcnew-daygrid-day-events",
                props.fgHeightFixed && "fcnew-daygrid-day-events-liquid"
              ].join(' ')}
              ref={props.fgContainerElRef}
            >
              {props.fg}
              <div className="fcnew-daygrid-day-bottom" style={{ marginTop: props.moreTop }}>
                <DayGridMoreLink
                  allDayDate={props.date}
                  segs={props.segs}
                  hiddenSegs={props.hiddenSegs}
                  alignmentElRef={rootElRef}
                  alignGridTop={!props.showDayNumber}
                  extraDateSpan={props.extraDateSpan}
                  dateProfile={props.dateProfile}
                  eventSelection={props.eventSelection}
                  eventDrag={props.eventDrag}
                  eventResize={props.eventResize}
                  todayRange={props.todayRange}
                />
              </div>
            </div>
            <div className="fcnew-daygrid-day-bg">
              {props.bg}
            </div>
          </div>
        )}
      </DayCellContainer>
    )
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
