import { StandardEvent, BaseComponent, MinimalEventProps, createFormatter } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'

const DEFAULT_TIME_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  meridiem: false,
})

export interface TimeGridEventProps extends MinimalEventProps {
  isShort: boolean
}

export class TimeGridEvent extends BaseComponent<TimeGridEventProps> {
  render() {
    return (
      <StandardEvent
        {...this.props}
        elClasses={[
          'fcnew-timegrid-event',
          'fcnew-v-event',
          this.props.isShort && 'fcnew-timegrid-event-short',
        ]}
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
      />
    )
  }
}
