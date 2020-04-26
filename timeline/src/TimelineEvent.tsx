import { StandardEvent, MinimalEventProps, h, BaseComponent, EventMeta, Fragment } from '@fullcalendar/common'


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


  render() {
    let { props } = this

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
      <div className='fc-event-time'>{innerProps.timeText}</div>
    ,
    <div className='fc-event-title'>
      <div className='fc-timeline-event-title-cushion fc-sticky'>
        {innerProps.event.title || <Fragment>&nbsp;</Fragment>}
      </div>
    </div>
  ]
}
