import { createElement, Fragment } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { buildEventRangeTimeText, EventContentArg, EventRenderRange, getEventTagAndAttrs } from '../component-util/event-rendering.js'
import { DateFormatter } from '../datelib/DateFormatter.js'
import { EventContainer } from './EventContainer.js'
import { ElRef } from '../content-inject/ContentInjector.js'
import { DateMarker } from '../datelib/marker.js'

export interface StandardEventProps {
  elRef?: ElRef
  className?: string
  eventRange: EventRenderRange // timed/whole-day span
  slicedStart?: DateMarker // view-sliced timed/whole-day span
  slicedEnd?: DateMarker // view-sliced timed/whole-day span
  isStart: boolean // seg could have been split into small pieces
  isEnd: boolean // "
  isDragging: boolean // rename to isMirrorDragging? make optional?
  isResizing: boolean // rename to isMirrorResizing? make optional?
  isDateSelecting: boolean // rename to isMirrorDateSelecting? make optional?
  isSelected: boolean
  isPast: boolean
  isFuture: boolean
  isToday: boolean
  disableDragging?: boolean // defaults false
  disableResizing?: boolean // defaults false
  defaultTimeFormat: DateFormatter
  defaultDisplayEventTime?: boolean // default true
  defaultDisplayEventEnd?: boolean // default true
}

// should not be a purecomponent
export class StandardEvent extends BaseComponent<StandardEventProps> {
  render() {
    const { props, context } = this
    const { eventRange } = props
    const { options } = context
    const timeFormat = options.eventTimeFormat || props.defaultTimeFormat
    const timeText = buildEventRangeTimeText(
      timeFormat,
      eventRange, // just for def/instance
      props.slicedStart,
      props.slicedEnd,
      props.isStart,
      props.isEnd,
      context,
      props.defaultDisplayEventTime,
      props.defaultDisplayEventEnd,
    )
    const [tag, attrs] = getEventTagAndAttrs(eventRange, context)

    return (
      <EventContainer
        {...props /* includes elRef */}
        tag={tag}
        style={{
          borderColor: eventRange.ui.borderColor,
          backgroundColor: eventRange.ui.backgroundColor,
        }}
        attrs={attrs}
        defaultGenerator={renderInnerContent}
        timeText={timeText}
      >
        {(InnerContent, eventContentArg) => (
          <Fragment>
            <InnerContent
              tag="div"
              className='fc-event-inner'
              style={{ color: eventContentArg.textColor }}
            />
            {Boolean(eventContentArg.isStartResizable) && (
              <div className="fc-event-resizer fc-event-resizer-start" />
            )}
            {Boolean(eventContentArg.isEndResizable) && (
              <div className="fc-event-resizer fc-event-resizer-end" />
            )}
          </Fragment>
        )}
      </EventContainer>
    )
  }
}

function renderInnerContent(innerProps: EventContentArg) {
  return (
    <Fragment>
      {innerProps.timeText && (
        <div className="fc-event-time">{innerProps.timeText}</div>
      )}
      <div className="fc-event-title-outer">
        <div className="fc-event-title">
          {innerProps.event.title || <Fragment>&nbsp;</Fragment>}
        </div>
      </div>
    </Fragment>
  )
}
