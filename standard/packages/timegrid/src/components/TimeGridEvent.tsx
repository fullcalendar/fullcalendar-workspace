import { BaseComponent, MinimalEventProps, createFormatter, StandardEvent } from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
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
        display='column'
        level={props.level}
        isCompact={props.isCompact}
        className={
          // see note in TimeGridCol on why we use flexbox
          props.isLiquid ? classNames.liquid : ''
        }
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
      />
    )
  }
}
