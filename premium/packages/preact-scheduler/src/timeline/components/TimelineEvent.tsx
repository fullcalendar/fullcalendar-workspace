import { Dictionary, MinimalEventProps, BaseComponent, createFormatter, StandardEvent } from '@fullcalendar/preact/protected-api'

export interface TimelineEventProps extends MinimalEventProps {
  isTimeScale: boolean
  extraRenderProps?: Dictionary // so can include a resource
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
        display='row'
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
        defaultDisplayEventTime={!props.isTimeScale}
      />
    )
  }
}
