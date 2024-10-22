import { createElement, Fragment } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { buildEventRangeTimeText, EventContentArg, EventRenderRange, getEventRangeAnchorAttrs } from '../component-util/event-rendering.js'
import { DateFormatter } from '../datelib/DateFormatter.js'
import { EventContainer } from './EventContainer.js'
import { ElRef } from '../content-inject/ContentInjector.js'
import { DateMarker } from '../datelib/marker.js'

export interface StandardEventProps {
  elRef?: ElRef
  elClasses?: string[]
  eventRange: EventRenderRange,
  segStart?: DateMarker
  segEnd?: DateMarker
  isStart: boolean
  isEnd: boolean
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
    let { props, context } = this
    let { options } = context
    let { eventRange } = props
    let { ui } = eventRange
    let timeFormat = options.eventTimeFormat || props.defaultTimeFormat
    let timeText = buildEventRangeTimeText(
      eventRange,
      timeFormat,
      context,
      props.isStart,
      props.isEnd,
      props.segStart,
      props.segEnd,
      props.defaultDisplayEventTime,
      props.defaultDisplayEventEnd,
    )

    return (
      <EventContainer
        {...props /* includes elRef */}
        elTag="a"
        elStyle={{
          borderColor: ui.borderColor,
          backgroundColor: ui.backgroundColor,
        }}
        elAttrs={getEventRangeAnchorAttrs(eventRange, context)}
        defaultGenerator={renderInnerContent}
        timeText={timeText}
      >
        {(InnerContent, eventContentArg) => (
          <Fragment>
            <InnerContent
              elTag="div"
              elClasses={['fc-event-inner']}
              elStyle={{ color: eventContentArg.textColor }}
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
