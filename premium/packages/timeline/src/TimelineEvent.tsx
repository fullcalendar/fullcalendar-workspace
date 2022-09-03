import { StandardEvent, MinimalEventProps, createElement, BaseComponent, createFormatter } from '@fullcalendar/common'

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
    let { props } = this

    return (
      <StandardEvent
        {...props}
        extraClassNames={['fc-timeline-event', 'fc-h-event']}
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
        defaultDisplayEventTime={!props.isTimeScale}
      />
    )
  }
}
