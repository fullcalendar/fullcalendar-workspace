import {
  BaseComponent, DateMarker, NowTimer,
  greatestDurationDenominator, DateRange, NowIndicatorContainer,
  findElements, DateProfile,
} from '@fullcalendar/core/internal'
import { createElement, createRef, RefObject } from '@fullcalendar/core/preact'
import { TimelineHeaderRows } from './TimelineHeaderRows.js'
import { coordToCss, TimelineCoords } from './TimelineCoords.js'
import { TimelineDateProfile } from './timeline-date-profile.js'

export interface TimelineHeaderProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  slatCoords: TimelineCoords
  onMaxCushionWidth?: (number) => void
  verticalPositions?: Map<boolean | number, { top: number, height: number }>
}

export class TimelineHeader extends BaseComponent<TimelineHeaderProps> {
  rootElRef: RefObject<HTMLDivElement> = createRef<HTMLDivElement>()

  render() {
    let { props, context } = this

    // TODO: very repetitive
    // TODO: make part of tDateProfile?
    let timerUnit = greatestDurationDenominator(props.tDateProfile.slotDuration).unit

    // WORKAROUND: make ignore slatCoords when out of sync with dateProfile
    let slatCoords = props.slatCoords && props.slatCoords.dateProfile === props.dateProfile ? props.slatCoords : null

    return (
      <NowTimer unit={timerUnit}>
        {(nowDate: DateMarker, todayRange: DateRange) => (
          <div
            className='fc-timeline-header'
            ref={this.rootElRef}
          >
            <div>
              <TimelineHeaderRows
                dateProfile={props.dateProfile}
                tDateProfile={props.tDateProfile}
                nowDate={nowDate}
                todayRange={todayRange}
                verticalPositions={props.verticalPositions}
              />
            </div>
            {context.options.nowIndicator && (
              // need to have a container regardless of whether the current view has a visible now indicator
              // because apparently removal of the element resets the scroll for some reasons (issue #5351).
              // this issue doesn't happen for the timeline body however (
              <div className="fc-timeline-now-indicator-container">
                {(slatCoords && slatCoords.isDateInRange(nowDate)) && (
                  <NowIndicatorContainer
                    elClasses={['fc-timeline-now-indicator-arrow']}
                    elStyle={coordToCss(slatCoords.dateToCoord(nowDate), context.isRtl)}
                    isAxis
                    date={nowDate}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </NowTimer>
    )
  }

  componentDidMount() {
    this.updateSize()
  }

  componentDidUpdate() {
    this.updateSize()
  }

  updateSize() {
    if (this.props.onMaxCushionWidth) {
      this.props.onMaxCushionWidth(this.computeMaxCushionWidth())
    }
  }

  /*
  TODO: rethink this, called way too often
  */
  computeMaxCushionWidth() {
    return Math.ceil(
      Math.max(
        ...findElements(this.rootElRef.current, '.fc-timeline-header-row:last-child .fc-timeline-slot-cushion').map(
          (el) => el.getBoundingClientRect().width,
        ),
      )
    )
  }
}
