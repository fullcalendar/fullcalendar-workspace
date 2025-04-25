import { BaseComponent, MinimalEventProps, createFormatter, joinClassNames, StandardEvent } from '@fullcalendar/core/internal'
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
          // TODO: move to theme system somehow
          props.isShort && 'fc-timegrid-event-short',
          props.isInset && 'fc-timegrid-event-inset',

          // see note in TimeGridCol on why we use flexbox
          props.isLiquid && 'fc-liquid',
        )}
        hitClassName='fc-hit-x'
        defaultTimeFormat={DEFAULT_TIME_FORMAT}
      />
    )
  }
}
