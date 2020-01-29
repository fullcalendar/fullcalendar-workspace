import { h, BaseComponent, ChunkContentCallbackArgs } from '@fullcalendar/core'
import TimelineHeaderRows, { TimelineHeaderRowsProps } from './TimelineHeaderRows'


export type TimelineHeaderProps = TimelineHeaderRowsProps & ChunkContentCallbackArgs & {
  nowCoord?: number
}


export default class TimelineHeader extends BaseComponent<TimelineHeaderProps> {


  render(props: TimelineHeaderProps) {
    return (
      <div class='fc-timeline-header'>
        {props.nowCoord != null &&
          <div
            class='fc-now-indicator fc-now-indicator-arrow'
            style={{ left: props.nowCoord }}
          />
        }
        <table style={{ minWidth: props.tableMinWidth, width: props.tableWidth }}>
          {props.tableColGroupNode}
          <tbody>
            <TimelineHeaderRows
              dateProfile={props.dateProfile}
              tDateProfile={props.tDateProfile}
            />
          </tbody>
        </table>
      </div>
    )
  }

}
