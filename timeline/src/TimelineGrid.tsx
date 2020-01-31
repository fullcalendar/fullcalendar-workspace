import { h, ComponentContext, createRef, ViewProps, Hit, DateComponent, CssDimValue, VNode, DateMarker } from '@fullcalendar/core'
import TimelineCoords from './TimelineCoords'
import TimelineSlats from './TimelineSlats'
import TimelineLane from './TimelineLane'
import { TimelineDateProfile } from './timeline-date-profile'


export interface TimelinGridProps extends ViewProps {
  tDateProfile: TimelineDateProfile
  clientWidth: CssDimValue
  clientHeight: CssDimValue
  tableMinWidth: CssDimValue
  tableColGroupNode: VNode
  nowIndicatorDate: DateMarker | null
  onSlatCoords?: (coords: TimelineCoords) => void
  onScrollLeft?: (scrollLeft: number) => void
}

interface TimelineGridState {
  coords?: TimelineCoords
}


export default class TimelineGrid extends DateComponent<TimelinGridProps, TimelineGridState> {

  private slatsRef = createRef<TimelineSlats>()


  render(props: TimelinGridProps, state: TimelineGridState, context: ComponentContext) {
    let { dateProfile, tDateProfile } = props
    let nowIndicatorLeft = state.coords && state.coords.safeDateToCoord(props.nowIndicatorDate)

    return (
      <div class='fc-timeline-grid' ref={this.handeEl} style={{
        minWidth: props.tableMinWidth
      }}>
        <TimelineSlats
          ref={this.slatsRef}
          dateProfile={dateProfile}
          tDateProfile={tDateProfile}
          clientWidth={props.clientWidth}
          tableColGroupNode={props.tableColGroupNode}
          tableMinWidth={props.tableMinWidth}
          onCoords={this.handleCoords}
          onScrollLeft={props.onScrollLeft}
        />
        <TimelineLane
          dateProfile={props.dateProfile}
          dateProfileGenerator={props.dateProfileGenerator}
          tDateProfile={props.tDateProfile}
          nextDayThreshold={context.nextDayThreshold}
          businessHours={props.businessHours}
          eventStore={props.eventStore}
          eventUiBases={props.eventUiBases}
          dateSelection={props.dateSelection}
          eventSelection={props.eventSelection}
          eventDrag={props.eventDrag}
          eventResize={props.eventResize}
          timelineCoords={state.coords}
          minHeight={props.clientHeight}
        />
        {nowIndicatorLeft != null &&
          <div
            class='fc-now-indicator fc-now-indicator-line'
            style={{ left: nowIndicatorLeft }}
          />
        }
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
