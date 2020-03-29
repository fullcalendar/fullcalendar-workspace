import { h, ComponentContext, createRef, ViewProps, Hit, DateComponent, CssDimValue, VNode, DateMarker, NowTimer, greatestDurationDenominator, DateRange, NowIndicatorRoot } from '@fullcalendar/core'
import TimelineCoords from './TimelineCoords'
import TimelineSlats from './TimelineSlats'
import TimelineLane from './TimelineLane'
import { TimelineDateProfile } from './timeline-date-profile'


export interface TimelinGridProps extends ViewProps {
  tDateProfile: TimelineDateProfile
  clientWidth: number | null
  clientHeight: number | null
  tableMinWidth: CssDimValue
  tableColGroupNode: VNode
  onSlatCoords?: (coords: TimelineCoords) => void
  onScrollLeftRequest?: (scrollLeft: number) => void
}

interface TimelineGridState {
  coords?: TimelineCoords
}


export default class TimelineGrid extends DateComponent<TimelinGridProps, TimelineGridState> {

  private slatsRef = createRef<TimelineSlats>()


  render(props: TimelinGridProps, state: TimelineGridState, context: ComponentContext) {
    let { dateProfile, tDateProfile } = props
    let timerUnit = greatestDurationDenominator(tDateProfile.slotDuration).unit

    return (
      <div class='fc-timeline-body' ref={this.handeEl} style={{
        minWidth: props.tableMinWidth,
        height: props.clientHeight,
        width: props.clientWidth
      }}>
        <NowTimer unit={timerUnit} content={(nowDate: DateMarker, todayRange: DateRange) => [
          <TimelineSlats
            ref={this.slatsRef}
            dateProfile={dateProfile}
            tDateProfile={tDateProfile}
            nowDate={nowDate}
            todayRange={todayRange}
            clientWidth={props.clientWidth}
            tableColGroupNode={props.tableColGroupNode}
            tableMinWidth={props.tableMinWidth}
            onCoords={this.handleCoords}
            onScrollLeftRequest={props.onScrollLeftRequest}
          />,
          <TimelineLane
            dateProfile={props.dateProfile}
            dateProfileGenerator={props.dateProfileGenerator}
            tDateProfile={props.tDateProfile}
            nowDate={nowDate}
            todayRange={todayRange}
            nextDayThreshold={context.nextDayThreshold}
            businessHours={props.businessHours}
            eventStore={props.eventStore}
            eventUiBases={props.eventUiBases}
            dateSelection={props.dateSelection}
            eventSelection={props.eventSelection}
            eventDrag={props.eventDrag}
            eventResize={props.eventResize}
            timelineCoords={state.coords}
          />,
          (context.options.nowIndicator && state.coords && state.coords.isDateInRange(nowDate)) &&
            <NowIndicatorRoot isAxis={false} date={nowDate}>
              {(rootElRef, classNames, innerElRef, innerContent) => (
                <div
                  ref={rootElRef}
                  className={[ 'fc-timeline-now-indicator-line' ].concat(classNames).join(' ')}
                  style={{ left: state.coords.dateToCoord(nowDate) }}
                >{innerContent}</div>
              )}
            </NowIndicatorRoot>
        ]} />
      </div>
    )
  }


  handeEl = (el: HTMLElement | null) => {
    if (el) {
      this.context.calendar.registerInteractiveComponent(this, { el })
    } else {
      this.context.calendar.unregisterInteractiveComponent(this)
    }
  }


  handleCoords = (coords: TimelineCoords) => {
    this.setState({ coords })

    if (this.props.onSlatCoords) {
      this.props.onSlatCoords(coords)
    }
  }


  // Hit System
  // ------------------------------------------------------------------------------------------

  queryHit(positionLeft: number, positionTop: number, elWidth: number, elHeight: number): Hit {
    let slats = this.slatsRef.current
    let slatHit = slats.positionToHit(positionLeft)

    if (slatHit) {
      return {
        component: this,
        dateSpan: slatHit.dateSpan,
        rect: {
          left: slatHit.left,
          right: slatHit.right,
          top: 0,
          bottom: elHeight
        },
        dayEl: slatHit.dayEl,
        layer: 0
      }
    }
  }

}
