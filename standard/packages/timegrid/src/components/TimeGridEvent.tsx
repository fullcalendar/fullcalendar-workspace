import { StandardEvent, BaseComponent, MinimalEventProps, createFormatter, joinClassNames } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'

const DEFAULT_TIME_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  meridiem: false,
})

export interface TimeGridEventProps extends MinimalEventProps {
  isInset: boolean
  isShort: boolean
  isLiquid?: boolean
}

export class TimeGridEvent extends BaseComponent<TimeGridEventProps> {
  render() {
    const { props } = this

    return (
      <StandardEvent
        {...props}
        className={joinClassNames(
          'fc-timegrid-event',
          props.isShort && 'fc-timegrid-event-short',
          props.isInset && 'fc-timegrid-event-inset',
          'fc-v-event',
          props.isLiquid && 'fc-liquid', // see note in TimeGridCol on why we use flexbox
        )}
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
      />
    )
  }
}
