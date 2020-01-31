import { h, BaseComponent, CssDimValue, VNode, DateMarker } from '@fullcalendar/core'
import TimelineHeaderRows, { TimelineHeaderRowsProps } from './TimelineHeaderRows'
import TimelineCoords from './TimelineCoords'


export interface TimelineHeaderProps extends TimelineHeaderRowsProps {
  clientWidth: CssDimValue
  clientHeight: CssDimValue
  tableMinWidth: CssDimValue
  tableColGroupNode: VNode
  nowIndicatorDate: DateMarker | null
  slatCoords: TimelineCoords
}


export default class TimelineHeader extends BaseComponent<TimelineHeaderProps> {


  render(props: TimelineHeaderProps) {
    let nowIndicatorLeft = props.slatCoords && props.slatCoords.safeDateToCoord(props.nowIndicatorDate)

    return (
      <div class='fc-timeline-header'>
        <table style={{ minWidth: props.tableMinWidth, width: props.clientWidth }}>
          {props.tableColGroupNode}
          <tbody>
            <TimelineHeaderRows
              dateProfile={props.dateProfile}
              tDateProfile={props.tDateProfile}
            />
          </tbody>
        </table>
        {nowIndicatorLeft != null &&
          <div
            class='fc-now-indicator fc-now-indicator-arrow'
            style={{ left: nowIndicatorLeft }}
          />
        }
      </div>
    )
  }

}
