import { BaseComponent, MinimalEventProps, createFormatter, StandardEvent } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'

const DEFAULT_TIME_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  meridiem: false,
})

export interface TimeGridEventProps extends MinimalEventProps {
  level: number
  isCompact: boolean
  isLiquid?: boolean
}

export class TimeGridEvent extends BaseComponent<TimeGridEventProps> {
  render() {
    const { props } = this

    return (
      <StandardEvent
        {...props}
        axis='y'
        level={props.level}
        isCompact={props.isCompact}
        className={
          // see note in TimeGridCol on why we use flexbox
          props.isLiquid ? 'fcu-liquid' : ''
        }
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
      />
    )
  }
}
