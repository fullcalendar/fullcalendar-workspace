import { StandardEvent, MinimalEventProps, h, BaseComponent } from '@fullcalendar/core'


export interface TimelineEventProps extends MinimalEventProps {
  isTimeScale: boolean
}

const DEFAULT_TIME_FORMAT = {
  hour: 'numeric',
  minute: '2-digit',
  omitZeroMinute: true,
  meridiem: 'narrow'
}


export default class TimelineEvent extends BaseComponent<TimelineEventProps> {


  render(props: TimelineEventProps) {
    return (
      <StandardEvent
        {...props}
        extraClassNames={[ 'fc-timeline-event', 'fc-h-event' ]}
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
        defaultDisplayEventTime={!props.isTimeScale}
      />
    )
  }

}
