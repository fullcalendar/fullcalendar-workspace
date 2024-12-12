import { AllDayContentArg, EventContentArg, EventRenderRange } from '@fullcalendar/core'
import { BaseComponent, buildEventRangeTimeText, ContentContainer, createFormatter, DateFormatter, DateMarker, EventContainer, getEventRangeAnchorAttrs, MinimalEventProps, setRef, ViewContext, watchWidth } from "@fullcalendar/core/internal";
import { ComponentChild, ComponentChildren, createElement, Fragment, Ref } from '@fullcalendar/core/preact'

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
  private disconnectTitleWidth?: () => void

  render() {
    let { props, context } = this
    let { eventRange } = props
    let { options } = context

    let timeFormat = options.eventTimeFormat || DEFAULT_TIME_FORMAT
    let anchorAttrs = getEventRangeAnchorAttrs(eventRange, context)

    return (
      <EventContainer
        {...props}
        tag={anchorAttrs ? 'a' : 'div'}
        attrs={anchorAttrs}
        className='fc-list-event'
        defaultGenerator={renderEventTitleOnly}
        eventRange={eventRange}
        timeText=""
        disableDragging
        disableResizing
      >
        {(InnerContent, eventContentArg) => (
          <Fragment>
            <div className='fc-list-event-time-outer' style={{ width: props.timeOuterWidth }}>
              {this.buildTimeContent(
                eventRange,
                props.slicedStart,
                props.slicedEnd,
                props.isStart,
                props.isEnd,
                timeFormat,
                context,
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

  buildTimeContent(
    eventRange: EventRenderRange, // whole-day span
    slicedStart: DateMarker, // view-sliced whole-day span
    slicedEnd: DateMarker, // view-sliced whole-day span
    isStart: boolean,
    isEnd: boolean,
    timeFormat: DateFormatter,
    context: ViewContext,
  ): ComponentChildren {
    let { options } = context

    if (options.displayEventTime !== false) {
      if (eventRange.def.allDay || (!isStart && !isEnd)) {
        let renderProps: AllDayContentArg = {
          text: context.options.allDayText,
          view: context.viewApi,
        }

        return (
          <ContentContainer
            tag="div"
            className='fc-list-event-time'
            renderProps={renderProps}
            elRef={this.handleTitleEl}
            generatorName="allDayContent"
            customGenerator={options.allDayContent}
            defaultGenerator={renderAllDayInner}
            classNameGenerator={options.allDayClassNames}
            didMount={options.allDayDidMount}
            willUnmount={options.allDayWillUnmount}
          />
        )
      } else {
        return (
          <div className="fc-list-event-time" ref={this.handleTitleEl}>
            {buildEventRangeTimeText(
              timeFormat,
              eventRange,
              slicedStart,
              slicedEnd,
              isStart,
              isEnd,
              context,
            )}
          </div>
        )
      }
    }

    return null
  }

  private handleTitleEl = (titleEl: HTMLElement | null) => {
    if (this.disconnectTitleWidth) {
      this.disconnectTitleWidth()
    }
    if (titleEl) {
      this.disconnectTitleWidth = watchWidth(titleEl, (titleWidth) => {
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

function renderAllDayInner(renderProps: AllDayContentArg): ComponentChild {
  return renderProps.text
}
