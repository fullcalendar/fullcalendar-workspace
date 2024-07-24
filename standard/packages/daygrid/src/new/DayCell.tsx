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
import { DayCellMoreLink } from './DayCellMoreLink.js'
import { NewTableSegPlacement } from '../event-placement.js' // TODO: rename

export interface DayCellProps {
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

export class DayCell extends DateComponent<DayCellProps> {
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
        elRef={rootElRef}
        elClasses={[
          'fc-daygrid-day',
          ...(props.extraClassNames || []),
        ]}
        elAttrs={{
          ...props.extraDataAttrs,
          role: 'gridcell',
        }}
        elStyle={{
          width: props.width
        }}
        defaultGenerator={renderTopInner}
        date={props.date}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        showDayNumber={props.showDayNumber}
        isMonthStart={isMonthStart}
        extraRenderProps={props.extraRenderProps}
      >
        {(InnerContent, renderProps) => (
          <div
            ref={props.innerElRef}
            className="fc-daygrid-day-frame fc-scrollgrid-sync-inner"
          >
            {!renderProps.isDisabled &&
              (props.showDayNumber || hasCustomDayCellContent(options)) ? (
                <div className="fc-daygrid-day-top">
                  <InnerContent
                    elTag="a"
                    elClasses={[
                      'fc-daygrid-day-number',
                      isMonthStart && 'fc-daygrid-month-start',
                    ]}
                    elAttrs={buildNavLinkAttrs(context, props.date)}
                  />
                </div>
              ) : props.showDayNumber ? (
                // for creating correct amount of space (see issue #7162)
                <div className="fc-daygrid-day-top" style={{ visibility: 'hidden' }}>
                  <a className="fc-daygrid-day-number">&nbsp;</a>
                </div>
              ) : undefined}
            <div
              className={[
                "fc-daygrid-day-events",
                props.fgHeightFixed && "fc-newnew-liquid-height"
              ].join(' ')}
              ref={props.fgContainerElRef}
            >
              {props.fg}
              <div className="fc-daygrid-day-bottom" style={{ marginTop: props.moreTop }}>
                <DayCellMoreLink
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
            <div className="fc-daygrid-day-bg">
              {props.bg}
            </div>
          </div>
        )}
      </DayCellContainer>
    )
  }
}

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
