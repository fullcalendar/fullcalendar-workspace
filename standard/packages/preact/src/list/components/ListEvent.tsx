import { memo } from 'react'
import { useViewOptions } from '../../hooks/useGranularContexts'
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

export const ListEvent = memo(function ListEvent(props: ListEventProps) {
  const options = useViewOptions()
  const { eventRange } = props

  const { displayEventTime } = options
  const forcedTimeText = (displayEventTime !== false) && (eventRange.def.allDay || (!props.isStart && !props.isEnd))
    ? options.allDayText
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
})
