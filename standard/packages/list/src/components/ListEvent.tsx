import { BaseComponent, createFormatter, MinimalEventProps, StandardEvent2 } from "@fullcalendar/core/internal";
import { createElement } from '@fullcalendar/core/preact';

const DEFAULT_TIME_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  meridiem: 'short',
})

export interface ListEventProps extends MinimalEventProps {
}

export class ListEvent extends BaseComponent<ListEventProps> {
  render() {
    let { props, context } = this
    let { eventRange } = props

    let forcedTimeText = (eventRange.def.allDay || (!props.isStart && !props.isEnd))
      ? context.options.allDayText
      : undefined

    return (
      <StandardEvent2
        {...props}
        attrs={{
          role: 'listitem',
        }}
        forcedTimeText={forcedTimeText}
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
        disableDragging
        disableResizing
      />
    )
  }
}
