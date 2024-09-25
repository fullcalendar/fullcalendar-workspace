import { StandardEvent, MinimalEventProps, BaseComponent, createFormatter } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'

export interface TimelineEventProps extends MinimalEventProps {
  isTimeScale: boolean
}

const DEFAULT_TIME_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  omitZeroMinute: true,
  meridiem: 'narrow',
})

export class TimelineEvent extends BaseComponent<TimelineEventProps> {
  render() {
    let { props, context } = this
    let { options } = context

    return (
      <StandardEvent
        {...props}
        elClasses={[
          'fcnew-timeline-event',
          'fcnew-h-event',
          options.eventOverlap === false // TODO: fix bad default
            ? 'fcnew-timeline-event-spacious'
            : ''
        ]}
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
        defaultDisplayEventTime={!props.isTimeScale}
      />
    )
  }
}
