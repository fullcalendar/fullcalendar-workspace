import { h, ChunkContentCallbackArgs, ComponentContext, createRef, ViewProps, Hit, DateComponent } from '@fullcalendar/core'
import TimelineCoords from './TimelineCoords'
import TimelineSlats from './TimelineSlats'
import TimelineLane from './TimelineLane'
import { TimelineDateProfile } from './timeline-date-profile'


export type TimelinGridProps = ChunkContentCallbackArgs & ViewProps & {
  tDateProfile: TimelineDateProfile
  nowCoord?: number
  onCoords?: (coords: TimelineCoords) => void
}

interface TimelineGridState {
  coords?: TimelineCoords
}


export default class TimelineGrid extends DateComponent<TimelinGridProps, TimelineGridState> {

  private slatsRef = createRef<TimelineSlats>()


  render(props: TimelinGridProps, state: TimelineGridState, context: ComponentContext) {
    let { theme } = context
    let { dateProfile, tDateProfile } = props

    return (
      <div class='fc-timeline-grid' ref={this.handeEl} style={{
        minWidth: props.tableMinWidth
      }}>
        {props.nowCoord != null &&
          <div
            class='fc-now-indicator fc-now-indicator-line'
            style={{ left: props.nowCoord }}
          />
        }
        <div class='fc-slats'>
          <table
            class={theme.getClass('table')}
            style={{
              minWidth: props.tableMinWidth,
              width: props.tableWidth
            }}
          >
            {props.tableColGroupNode}
            <tbody>
              <TimelineSlats
                ref={this.slatsRef}
                dateProfile={dateProfile}
                tDateProfile={tDateProfile}
                allowSizing={props.isSizingReady}
                onCoords={this.handleCoords}
              />
            </tbody>
          </table>
        </div>
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
          minHeight={props.tableHeight}
        />
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

    if (this.props.onCoords) {
      this.props.onCoords(coords)
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
