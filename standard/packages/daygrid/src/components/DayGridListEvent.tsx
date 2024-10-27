import { EventContentArg, EventRenderRange } from '@fullcalendar/core'
import {
  BaseComponent,
  buildEventRangeTimeText,
  EventContainer,
  getEventRangeAnchorAttrs,
} from '@fullcalendar/core/internal'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { DEFAULT_TABLE_EVENT_TIME_FORMAT } from '../event-rendering.js'

export interface DayGridListEventProps {
  eventRange: EventRenderRange
  isStart: boolean
  isEnd: boolean
  isDragging: boolean
  isSelected: boolean
  isPast: boolean
  isFuture: boolean
  isToday: boolean
  defaultDisplayEventEnd: boolean
  children?: never
}

export class DayGridListEvent extends BaseComponent<DayGridListEventProps> {
  render() {
    let { props, context } = this
    let { options } = context
    let { eventRange } = props
    let timeFormat = options.eventTimeFormat || DEFAULT_TABLE_EVENT_TIME_FORMAT
    let timeText = buildEventRangeTimeText(
      eventRange,
      timeFormat,
      context,
      props.isStart,
      props.isEnd,
      null,
      null,
      true, // defaultDisplayEventTime
      props.defaultDisplayEventEnd,
    )

    return (
      <EventContainer
        {...props}
        tag="a"
        attrs={getEventRangeAnchorAttrs(eventRange, context)}
        className='fc-daygrid-dot-event fc-daygrid-event'
        defaultGenerator={renderInnerContent}
        timeText={timeText}
        isResizing={false}
        isDateSelecting={false}
      />
    )
  }
}

function renderInnerContent(renderProps: EventContentArg) {
  return (
    <Fragment>
      <div
        className="fc-daygrid-event-dot"
        style={{ borderColor: renderProps.borderColor || renderProps.backgroundColor }}
      />
      {renderProps.timeText && (
        <div className="fc-event-time">{renderProps.timeText}</div>
      )}
      <div className="fc-event-title">
        {renderProps.event.title || <Fragment>&nbsp;</Fragment>}
      </div>
    </Fragment>
  )
}
