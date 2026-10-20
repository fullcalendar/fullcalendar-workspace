import { memo } from 'react'
import { MinimalEventProps } from '../../component-util/event-rendering'
import { createFormatter } from '../../datelib/formatting'
import { ForegroundEvent, columnEventVariant } from '../../common/events'
import classNames from '../../styles.module.css'

const DEFAULT_TIME_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  meridiem: false,
})

export interface TimeGridEventProps extends MinimalEventProps {
  level: number
  isNarrow: boolean
  isShort: boolean
  isLiquid?: boolean
  disableResizing?: boolean // HACK
}

export const TimeGridEvent = memo(function TimeGridEvent(props: TimeGridEventProps) {
  return (
    <ForegroundEvent
      variant={columnEventVariant}
      {...props}
      level={props.level}
      isNarrow={props.isNarrow}
      isShort={props.isShort}
      className={
        // see note in TimeGridCol on why we use flexbox
        props.isLiquid ? classNames.liquid : ''
      }
      disableLiquid={!props.isLiquid}
      defaultTimeFormat={DEFAULT_TIME_FORMAT}
    />
  )
})
