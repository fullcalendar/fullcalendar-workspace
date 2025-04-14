import { MinimalEventProps, BaseComponent, createFormatter, joinClassNames, StandardEvent2 } from '@fullcalendar/core/internal'
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
      <StandardEvent2
        {...props}
        className={joinClassNames(
          // TODO: theme should be responsible for classname somehow...
          options.eventOverlap === false // TODO: fix bad default
            && 'fc-timeline-event-spacious',
        )}
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
        defaultDisplayEventTime={!props.isTimeScale}
      />
    )
  }
}
