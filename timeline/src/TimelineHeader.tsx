import { h, BaseComponent, CssDimValue, VNode, DateMarker, ComponentContext, NowTimer, greatestDurationDenominator, DateRange, DateProfile, NowIndicatorRoot, createRef, findElements } from '@fullcalendar/core'
import TimelineHeaderRows from './TimelineHeaderRows'
import TimelineCoords from './TimelineCoords'
import { TimelineDateProfile } from './timeline-date-profile'


export interface TimelineHeaderProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  clientWidth: CssDimValue
  clientHeight: CssDimValue
  tableMinWidth: CssDimValue
  tableColGroupNode: VNode
  slatCoords: TimelineCoords
  rowInnerHeights?: number[]
  onMaxCushionWidth?: (number) => void
}


export default class TimelineHeader extends BaseComponent<TimelineHeaderProps> {

  rootElRef = createRef<HTMLDivElement>()


  render(props: TimelineHeaderProps, state: {}, context: ComponentContext) {

    // TODO: very repetitive
    // TODO: make part of tDateProfile?
    let timerUnit = greatestDurationDenominator(props.tDateProfile.slotDuration).unit

    return (
      <NowTimer unit={timerUnit} content={(nowDate: DateMarker, todayRange: DateRange) => (
        <div class='fc-timeline-header' ref={this.rootElRef}>
          <table
            className='fc-scrollgrid-sync-table'
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
          {(context.options.nowIndicator && props.slatCoords && props.slatCoords.isDateInRange(nowDate)) &&
            <NowIndicatorRoot isAxis={true} date={nowDate}>
              {(rootElRef, classNames, innerElRef, innerContent) => (
                <div
                  ref={rootElRef}
                  className={[ 'fc-timeline-now-indicator-arrow' ].concat(classNames).join(' ')}
                  style={{ left: props.slatCoords.dateToCoord(nowDate) }}
                >{innerContent}</div>
              )}
            </NowIndicatorRoot>
          }
        </div>
      )} />
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


  computeMaxCushionWidth() {
    return Math.max(
      ...findElements(this.rootElRef.current, '.fc-timeline-slot-cushion').map(
        (el) => el.getBoundingClientRect().width
      )
    )
  }

}
