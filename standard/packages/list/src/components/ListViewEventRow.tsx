import { AllDayContentArg, EventRenderRange } from '@fullcalendar/core'
import {
  MinimalEventProps, BaseComponent, ViewContext,
  isMultiDayRange, DateFormatter, buildEventRangeTimeText, createFormatter,
  getEventRangeAnchorAttrs, EventContainer, ContentContainer,
  DateMarker,
  joinClassNames,
} from '@fullcalendar/core/internal'
import {
  createElement,
  ComponentChildren,
  Fragment,
  ComponentChild,
} from '@fullcalendar/core/preact'

const DEFAULT_TIME_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  meridiem: 'short',
})

export interface ListViewEventRowProps extends MinimalEventProps {
  timeHeaderId: string
  eventHeaderId: string
  dateHeaderId: string
  segStart: DateMarker | undefined
  segEnd: DateMarker | undefined
}

export class ListViewEventRow extends BaseComponent<ListViewEventRowProps> {
  render() {
    let { props, context } = this
    let { options } = context
    let { eventRange, timeHeaderId, eventHeaderId, dateHeaderId } = props
    let timeFormat = options.eventTimeFormat || DEFAULT_TIME_FORMAT

    return (
      <EventContainer
        {...props}
        elTag="tr"
        elClassName={joinClassNames(
          'fc-list-event',
          eventRange.def.url && 'fc-event-forced-url',
        )}
        defaultGenerator={() => renderEventInnerContent(eventRange, context) /* weird */}
        eventRange={eventRange}
        timeText=""
        disableDragging={true}
        disableResizing={true}
      >
        {(InnerContent, eventContentArg) => (
          <Fragment>
            {buildTimeContent(eventRange, props.isStart, props.isEnd, props.segStart, props.segEnd, timeFormat, context, timeHeaderId, dateHeaderId)}
            <td aria-hidden className="fc-list-event-dot-cell">
              <span
                className="fc-list-event-dot"
                style={{
                  borderColor: eventContentArg.borderColor || eventContentArg.backgroundColor,
                }}
              />
            </td>
            <InnerContent
              elTag="td"
              elAttrs={{ headers: `${eventHeaderId} ${dateHeaderId}` }}
              elClassName='fc-list-event-title'
            />
          </Fragment>
        )}
      </EventContainer>
    )
  }
}

function renderEventInnerContent(eventRange: EventRenderRange, context: ViewContext) {
  let interactiveAttrs = getEventRangeAnchorAttrs(eventRange, context)
  return (
    <a {...interactiveAttrs}>
      {/* TODO: document how whole row become clickable */}
      {eventRange.def.title}
    </a>
  )
}

function buildTimeContent(
  eventRange: EventRenderRange,
  isStart: boolean,
  isEnd: boolean,
  segStart: DateMarker | undefined,
  segEnd: DateMarker | undefined,
  timeFormat: DateFormatter,
  context: ViewContext,
  timeHeaderId: string,
  dateHeaderId: string,
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
          elTag="td"
          elClassName='fc-list-event-time'
          elAttrs={{
            headers: `${timeHeaderId} ${dateHeaderId}`,
          }}
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
      <td className="fc-list-event-time">
        {timeText}
      </td>
    )
  }

  return null
}

function renderAllDayInner(renderProps: AllDayContentArg): ComponentChild {
  return renderProps.text
}
