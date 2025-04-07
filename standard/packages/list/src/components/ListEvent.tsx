import { EventContentArg } from '@fullcalendar/core'
import { BaseComponent, buildEventRangeTimeText, createFormatter, EventContainer, getEventTagAndAttrs, MinimalEventProps, setRef, watchWidth } from "@fullcalendar/core/internal";
import { createElement, Fragment, Ref } from '@fullcalendar/core/preact'

const DEFAULT_TIME_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  meridiem: 'short',
})

export interface ListEventProps extends MinimalEventProps {
  timeWidthRef: Ref<number>
  timeOuterWidth: number | undefined
}

export class ListEvent extends BaseComponent<ListEventProps> {
  // internal
  private disconnectTimeWidth?: () => void

  render() {
    let { props, context } = this
    let { eventRange } = props
    let { options } = context

    let [tag, attrs] = getEventTagAndAttrs(eventRange, context)
    let timeFormat = options.eventTimeFormat || DEFAULT_TIME_FORMAT
    let timeText = (eventRange.def.allDay || (!props.isStart && !props.isEnd))
      ? context.options.allDayText
      : buildEventRangeTimeText(
          timeFormat,
          eventRange,
          props.slicedStart,
          props.slicedEnd,
          props.isStart,
          props.isEnd,
          context,
        )

    return (
      <EventContainer
        {...props}
        tag={tag}
        attrs={{
          role: 'listitem',
          ...attrs,
        }}
        className='fc-list-event'
        defaultGenerator={renderEventTitleOnly}
        timeText={timeText}
        disableDragging
        disableResizing
      >
        {(InnerContent, eventContentArg) => (
          <Fragment>
            <div className='fc-list-event-time-outer' style={{ width: props.timeOuterWidth }}>
              {(options.displayEventTime !== false) && (
                <div className="fc-list-event-time" ref={this.handleTimeEl}>
                  {timeText}
                </div>
              )}
            </div>
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

  private handleTimeEl = (titleEl: HTMLElement | null) => {
    if (this.disconnectTimeWidth) {
      this.disconnectTimeWidth()
    }
    if (titleEl) {
      this.disconnectTimeWidth = watchWidth(titleEl, (titleWidth) => {
        setRef(this.props.timeWidthRef, titleWidth)
      })
    }
  }

  componentWillUnmount(): void {
    setRef(this.props.timeWidthRef, null)
  }
}

function renderEventTitleOnly(renderProps: EventContentArg): string {
  return renderProps.event.title
}
