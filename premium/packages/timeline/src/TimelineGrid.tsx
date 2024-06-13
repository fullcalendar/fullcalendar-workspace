import {
  ViewProps, Hit, DateComponent, DateMarker, NowTimer,
  greatestDurationDenominator, DateRange, NowIndicatorContainer,
} from '@fullcalendar/core/internal'
import { createElement, createRef, Fragment } from '@fullcalendar/core/preact'
import { coordToCss, TimelineCoords } from './TimelineCoords.js'
import { TimelineSlats } from './TimelineSlats.js'
import { TimelineLane } from './TimelineLane.js'
import { TimelineDateProfile } from './timeline-date-profile.js'

export interface TimelinGridProps extends ViewProps {
  tDateProfile: TimelineDateProfile
  onSlatCoords?: (coords: TimelineCoords) => void
  onScrollLeftRequest?: (scrollLeft: number) => void
}

interface TimelineGridState {
  coords: TimelineCoords | null
}

export class TimelineGrid extends DateComponent<TimelinGridProps, TimelineGridState> {
  private slatsRef = createRef<TimelineSlats>()

  state: TimelineGridState = {
    coords: null,
  }

  render() {
    let { props, state, context } = this
    let { options } = context
    let { dateProfile, tDateProfile } = props
    let timerUnit = greatestDurationDenominator(tDateProfile.slotDuration).unit

    return (
      <div
        className="fc-timeline-body"
        ref={this.handeEl}
      >
        <NowTimer unit={timerUnit}>
          {(nowDate: DateMarker, todayRange: DateRange) => (
            <Fragment>
              <TimelineSlats
                ref={this.slatsRef}
                dateProfile={dateProfile}
                tDateProfile={tDateProfile}
                nowDate={nowDate}
                todayRange={todayRange}
                onCoords={this.handleCoords}
                onScrollLeftRequest={props.onScrollLeftRequest}
              />
              <TimelineLane
                dateProfile={dateProfile}
                tDateProfile={props.tDateProfile}
                nowDate={nowDate}
                todayRange={todayRange}
                nextDayThreshold={options.nextDayThreshold}
                businessHours={props.businessHours}
                eventStore={props.eventStore}
                eventUiBases={props.eventUiBases}
                dateSelection={props.dateSelection}
                eventSelection={props.eventSelection}
                eventDrag={props.eventDrag}
                eventResize={props.eventResize}
                timelineCoords={state.coords}
                syncParentMinHeight
              />
              {(options.nowIndicator && state.coords && state.coords.isDateInRange(nowDate)) && (
                <div className="fc-timeline-now-indicator-container">
                  <NowIndicatorContainer
                    elClasses={['fc-timeline-now-indicator-line']}
                    elStyle={coordToCss(state.coords.dateToCoord(nowDate), context.isRtl)}
                    isAxis={false}
                    date={nowDate}
                  />
                </div>
              )}
            </Fragment>
          )}
        </NowTimer>
      </div>
    )
  }

  handeEl = (el: HTMLElement | null) => {
    if (el) {
      this.context.registerInteractiveComponent(this, { el })
    } else {
      this.context.unregisterInteractiveComponent(this)
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
        dateProfile: this.props.dateProfile,
        dateSpan: slatHit.dateSpan,
        rect: {
          left: slatHit.left,
          right: slatHit.right,
          top: 0,
          bottom: elHeight,
        },
        dayEl: slatHit.dayEl,
        layer: 0,
      }
    }

    return null
  }
}
