import { StandardEvent, BaseComponent, MinimalEventProps } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { DEFAULT_TABLE_EVENT_TIME_FORMAT } from '../event-rendering.js'

export interface DayGridBlockEventProps extends MinimalEventProps {
  defaultDisplayEventEnd: boolean
}

export class DayGridBlockEvent extends BaseComponent<DayGridBlockEventProps> {
  render() {
    let { props } = this

    return (
      <StandardEvent
        {...props}
        elClasses={['fc-daygrid-event', 'fc-daygrid-block-event', 'fc-h-event']}
        defaultTimeFormat={DEFAULT_TABLE_EVENT_TIME_FORMAT}
        defaultDisplayEventEnd={props.defaultDisplayEventEnd}
        disableResizing={!props.eventRange.def.allDay}
      />
    )
  }
}
