import { StandardEvent, BaseComponent, MinimalEventProps, createFormatter } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'

const DEFAULT_TIME_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  meridiem: false,
})

export interface TimeGridEventProps extends MinimalEventProps {
  isInset: boolean
  isShort: boolean
}

export class TimeGridEvent extends BaseComponent<TimeGridEventProps> {
  render() {
    const { props } = this

    return (
      <StandardEvent
        {...props}
        elClasses={[
          'fc-timegrid-event',
          'fc-v-event',
          props.isShort ? 'fc-timegrid-event-short' : '',
          props.isInset ? 'fc-timegrid-event-inset' : '',
        ]}
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
      />
    )
  }
}
