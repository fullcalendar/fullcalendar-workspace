import { AllDayContentArg, EventRenderRange } from '@fullcalendar/core'
import { BaseComponent, buildEventRangeTimeText, ContentContainer, createFormatter, DateFormatter, DateMarker, EventContainer, getEventRangeAnchorAttrs, isMultiDayRange, MinimalEventProps, setRef, ViewContext, watchWidth } from "@fullcalendar/core/internal";
import { ComponentChild, ComponentChildren, createElement, Fragment, Ref } from '@fullcalendar/core/preact'

const DEFAULT_TIME_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  meridiem: 'short',
})

export interface ListEventProps extends MinimalEventProps {
  segStart: DateMarker | undefined
  segEnd: DateMarker | undefined
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
        defaultGenerator={() => getEventRangeTitle(eventRange) /* weird */}
        eventRange={eventRange}
        timeText=""
        disableDragging={true}
        disableResizing={true}
      >
        {(InnerContent, eventContentArg) => (
          <Fragment>
            <div className='fc-list-event-time-outer' style={{ width: props.timeOuterWidth }}>
              {this.buildTimeContent(eventRange, props.isStart, props.isEnd, props.segStart, props.segEnd, timeFormat, context)}
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
            elRef={this.handleTitleEl}
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
        <div className="fc-list-event-time" ref={this.handleTitleEl}>
          {timeText}
        </div>
      )
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

function getEventRangeTitle(eventRange: EventRenderRange): string {
  return eventRange.def.title
}

function renderAllDayInner(renderProps: AllDayContentArg): ComponentChild {
  return renderProps.text
}
