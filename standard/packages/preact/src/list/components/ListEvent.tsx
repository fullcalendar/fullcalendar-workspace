import { BaseComponent } from '../../vdom-util'
import { createFormatter } from '../../datelib/formatting'
import type { MinimalEventProps } from '../../component-util/event-rendering'
import { ForegroundEvent, listItemEventVariant } from '../../common/events'

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

    const { displayEventTime } = context.options
    let forcedTimeText = (displayEventTime !== false) && (eventRange.def.allDay || (!props.isStart && !props.isEnd))
      ? context.options.allDayText
      : undefined

    return (
      <ForegroundEvent
        {...props}
        variant={listItemEventVariant}
        forcedTimeText={forcedTimeText}
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
        disableDragging
        disableResizing
        disableZindexes // because conflicts with sticky list headers
      />
    )
  }
}
