import { StandardEvent, MinimalEventProps, h, BaseComponent, EventMeta, Fragment } from '@fullcalendar/core'


export interface TimelineEventProps extends MinimalEventProps {
  isTimeScale: boolean
}

const DEFAULT_TIME_FORMAT = {
  hour: 'numeric',
  minute: '2-digit',
  omitZeroMinute: true,
  meridiem: 'narrow'
}


export class TimelineEvent extends BaseComponent<TimelineEventProps> {


  render(props: TimelineEventProps) {
    return (
      <StandardEvent
        {...props}
        extraClassNames={[ 'fc-timeline-event', 'fc-h-event' ]}
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
        defaultDisplayEventTime={!props.isTimeScale}
        defaultContent={renderInnerContent}
      />
    )
  }

}


function renderInnerContent(innerProps: EventMeta) {
  return [
    innerProps.timeText &&
      <div class='fc-event-time'>{innerProps.timeText}</div>
    ,
    <div class='fc-event-title'>
      <div class='fc-timeline-event-title-cushion fc-sticky'>
        {innerProps.event.title || <Fragment>&nbsp;</Fragment>}
      </div>
    </div>
  ]
}
