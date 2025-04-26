import { BaseComponent, MinimalEventProps, createFormatter, joinClassNames, StandardEvent } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'

const DEFAULT_TIME_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  meridiem: false,
})

export interface TimeGridEventProps extends MinimalEventProps {
  isInset: boolean
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
        isCompact={props.isCompact}
        className={joinClassNames(
          props.isInset && 'fc-timegrid-event-inset',

          // see note in TimeGridCol on why we use flexbox
          props.isLiquid && 'fcu-liquid',
        )}
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
      />
    )
  }
}
