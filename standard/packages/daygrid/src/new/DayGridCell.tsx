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
import { NewTableSegPlacement } from '../event-placement.js'

export interface DayGridCellProps {
  dateProfile: DateProfile
  todayRange: DateRange
  date: DateMarker
  showDayNumber: boolean

  // content
  segPlacements: NewTableSegPlacement[] // for +more link popover content
  fgHeightFixed: boolean
  fg: ComponentChildren
  bg: ComponentChildren
  moreCnt: number
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
          'fc-new-daygrid-day',
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
                <div className="fc-new-daygrid-day-top">
                  <InnerContent
                    elTag="a"
                    elClasses={[
                      'fc-new-daygrid-day-number',
                      isMonthStart && 'fc-new-daygrid-month-start',
                    ]}
                    elAttrs={buildNavLinkAttrs(context, props.date)}
                  />
                </div>
              )}
            <div
              className={[
                "fc-new-daygrid-day-events",
                props.fgHeightFixed && "fc-new-daygrid-day-events-liquid"
              ].join(' ')}
              ref={props.fgContainerElRef}
            >
              {props.fg}
              <div className="fc-new-daygrid-day-bottom" style={{ marginTop: props.moreTop }}>
                <DayGridMoreLink
                  allDayDate={props.date}
                  segPlacements={props.segPlacements}
                  moreCnt={props.moreCnt}
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
            <div className="fc-new-daygrid-day-bg">
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
