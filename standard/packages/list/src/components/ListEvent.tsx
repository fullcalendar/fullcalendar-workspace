import { AllDayContentArg, EventRenderRange } from '@fullcalendar/core'
import { BaseComponent, buildEventRangeTimeText, ContentContainer, createFormatter, DateFormatter, DateMarker, EventContainer, getEventRangeAnchorAttrs, isMultiDayRange, MinimalEventProps, ViewContext } from "@fullcalendar/core/internal";
import { ComponentChild, ComponentChildren, createElement, Fragment } from '@fullcalendar/core/preact'

const DEFAULT_TIME_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  meridiem: 'short',
})

export interface ListEventProps extends MinimalEventProps {
  segStart: DateMarker | undefined
  segEnd: DateMarker | undefined
}

export class ListEvent extends BaseComponent<ListEventProps> {
  render() {
    let { props, context } = this
    let { eventRange  } = props
    let { options } = context

    let timeFormat = options.eventTimeFormat || DEFAULT_TIME_FORMAT
    let anchorAttrs = getEventRangeAnchorAttrs(eventRange, context)

    return (
      <EventContainer
        {...props}
        tag={anchorAttrs ? 'a' : 'div'}
        attrs={anchorAttrs}
        className='fc-list-event'
        defaultGenerator={() => getEventRangeTitle(eventRange) /* weird */}
        eventRange={eventRange}
        timeText=""
        disableDragging={true}
        disableResizing={true}
      >
        {(InnerContent, eventContentArg) => (
          <Fragment>
            {buildTimeContent(eventRange, props.isStart, props.isEnd, props.segStart, props.segEnd, timeFormat, context)}
            <div className="fc-list-event-dot-outer">
              <span
                className="fc-list-event-dot"
                style={{
                  borderColor: eventContentArg.borderColor || eventContentArg.backgroundColor,
                }}
              />
            </div>
            <InnerContent
              tag="div"
              className='fc-list-event-title'
            />
          </Fragment>
        )}
      </EventContainer>
    )
  }
}

function getEventRangeTitle(eventRange: EventRenderRange): string {
  return eventRange.def.title
}

function buildTimeContent(
  eventRange: EventRenderRange,
  isStart: boolean,
  isEnd: boolean,
  segStart: DateMarker | undefined,
  segEnd: DateMarker | undefined,
  timeFormat: DateFormatter,
  context: ViewContext,
): ComponentChildren {
  let { options } = context

  if (options.displayEventTime !== false) {
    let eventDef = eventRange.def
    let eventInstance = eventRange.instance
    let doAllDay = false
    let timeText: string

    if (eventDef.allDay) {
      doAllDay = true
    } else if (isMultiDayRange(eventRange.range)) { // TODO: use (!isStart || !isEnd) instead?
      if (isStart) {
        timeText = buildEventRangeTimeText(
          eventRange,
          timeFormat,
          context,
          isStart,
          isEnd,
          eventInstance.range.start,
          segEnd,
        )
      } else if (isEnd) {
        timeText = buildEventRangeTimeText(
          eventRange,
          timeFormat,
          context,
          isStart,
          isEnd,
          segStart,
          eventInstance.range.end,
        )
      } else {
        doAllDay = true
      }
    } else {
      timeText = buildEventRangeTimeText(
        eventRange,
        timeFormat,
        context,
        isStart,
        isEnd,
        segStart,
        segEnd,
      )
    }

    if (doAllDay) {
      let renderProps: AllDayContentArg = {
        text: context.options.allDayText,
        view: context.viewApi,
      }

      return (
        <ContentContainer
          tag="div"
          className='fc-list-event-time'
          renderProps={renderProps}
          generatorName="allDayContent"
          customGenerator={options.allDayContent}
          defaultGenerator={renderAllDayInner}
          classNameGenerator={options.allDayClassNames}
          didMount={options.allDayDidMount}
          willUnmount={options.allDayWillUnmount}
        />
      )
    }

    return (
      <div className="fc-list-event-time">
        {timeText}
      </div>
    )
  }

  return null
}

function renderAllDayInner(renderProps: AllDayContentArg): ComponentChild {
  return renderProps.text
}
