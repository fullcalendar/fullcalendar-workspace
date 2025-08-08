import { CssDimValue } from '@fullcalendar/core'
import {
  BaseComponent, DateMarker, NowTimer,
  greatestDurationDenominator, DateRange, NowIndicatorContainer,
  findElements, DateProfile,
} from '@fullcalendar/core/internal'
import { createElement, VNode, createRef, RefObject } from '@fullcalendar/core/preact'
import { TimelineHeaderRows } from './TimelineHeaderRows.js'
import { coordToCss, TimelineCoords } from './TimelineCoords.js'
import { TimelineDateProfile } from './timeline-date-profile.js'

export interface TimelineHeaderProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  clientWidth: number | null
  clientHeight: number | null
  tableMinWidth: CssDimValue
  tableColGroupNode: VNode
  slatCoords: TimelineCoords
  rowInnerHeights?: number[]
  onMaxCushionWidth?: (number) => void
}

export class TimelineHeader extends BaseComponent<TimelineHeaderProps> {
  rootElRef: RefObject<HTMLDivElement> = createRef<HTMLDivElement>()

  render() {
    let { props, context } = this

    // TODO: very repetitive
    // TODO: make part of tDateProfile?
    let { unit: timerUnit, value: timerUnitValue } = greatestDurationDenominator(props.tDateProfile.slotDuration)

    // WORKAROUND: make ignore slatCoords when out of sync with dateProfile
    let slatCoords = props.slatCoords && props.slatCoords.dateProfile === props.dateProfile ? props.slatCoords : null

    return (
      <NowTimer unit={timerUnit} unitValue={timerUnitValue}>
        {(nowDate: DateMarker, todayRange: DateRange) => (
          <div className="fc-timeline-header" ref={this.rootElRef}>
            <table
              aria-hidden
              className="fc-scrollgrid-sync-table"
              style={{ minWidth: props.tableMinWidth, width: props.clientWidth }}
            >
              {props.tableColGroupNode}
              <tbody>
                <TimelineHeaderRows
                  dateProfile={props.dateProfile}
                  tDateProfile={props.tDateProfile}
                  nowDate={nowDate}
                  todayRange={todayRange}
                  rowInnerHeights={props.rowInnerHeights}
                />
              </tbody>
            </table>
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

  computeMaxCushionWidth() { // TODO: called way too often
    return Math.max(
      ...findElements(this.rootElRef.current, '.fc-timeline-header-row:last-child .fc-timeline-slot-cushion').map(
        (el) => el.getBoundingClientRect().width,
      ),
    )
  }
}
