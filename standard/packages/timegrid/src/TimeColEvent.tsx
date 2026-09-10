import { StandardEvent, BaseComponent, Dictionary, MinimalEventProps, createFormatter } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'

const DEFAULT_TIME_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  meridiem: false,
})

export interface TimeColEventProps extends MinimalEventProps {
  isShort: boolean
  extraRenderProps?: Dictionary // so a view can expose the resource being rendered
}

export class TimeColEvent extends BaseComponent<TimeColEventProps> {
  render() {
    return (
      <StandardEvent
        {...this.props}
        elClasses={[
          'fc-timegrid-event',
          'fc-v-event',
          this.props.isShort && 'fc-timegrid-event-short',
        ]}
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
      />
    )
  }
}
