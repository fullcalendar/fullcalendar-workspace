import { StandardEvent, Dictionary, MinimalEventProps, BaseComponent, createFormatter } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'

export interface TimelineEventProps extends MinimalEventProps {
  isTimeScale: boolean
  extraRenderProps?: Dictionary // so a view can expose the resource being rendered
}

const DEFAULT_TIME_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  omitZeroMinute: true,
  meridiem: 'narrow',
})

export class TimelineEvent extends BaseComponent<TimelineEventProps> {
  render() {
    let { props } = this

    return (
      <StandardEvent
        {...props}
        elClasses={['fc-timeline-event', 'fc-h-event']}
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
        defaultDisplayEventTime={!props.isTimeScale}
      />
    )
  }
}
