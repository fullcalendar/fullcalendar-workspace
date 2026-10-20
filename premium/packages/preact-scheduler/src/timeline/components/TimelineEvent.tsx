import { memo } from 'react'
import { MinimalEventProps, createFormatter, ForegroundEvent, rowEventVariant } from '@fullcalendar/preact/protected-api'

export interface TimelineEventProps extends MinimalEventProps {
  isTimeScale: boolean
}

const DEFAULT_TIME_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  omitZeroMinute: true,
  meridiem: 'narrow',
})

export const TimelineEvent = memo(function TimelineEvent(props: TimelineEventProps) {

  return (
    <ForegroundEvent
      {...props}
      variant={rowEventVariant}
      defaultTimeFormat={DEFAULT_TIME_FORMAT}
      defaultDisplayEventTime={!props.isTimeScale}
    />
  )
})
