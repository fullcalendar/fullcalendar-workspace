import { createElement, Fragment } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { buildEventRangeTimeText, computeEventRangeDraggable, EventContentArg, EventRenderRange, getEventTagAndAttrs, setElEventRange } from '../component-util/event-rendering.js'
import { DateFormatter } from '../datelib/DateFormatter.js'
import { ContentContainer, generateClassName } from '../content-inject/ContentContainer.js'
import { ElRef } from '../content-inject/ContentInjector.js'
import { DateMarker } from '../datelib/marker.js'
import { memoize } from '../util/memoize.js'
import { EventDef } from '../structs/event-def.js'
import { EventInstance } from '../structs/event-instance.js'
import { EventImpl } from '../api/EventImpl.js'
import { ViewContext } from '../ViewContext.js'
import { joinArrayishClassNames, joinClassNames } from '../util/html.js'

export interface StandardEventProps {
  elRef?: ElRef
  attrs?: any
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
  isListItem?: boolean // default false
  forcedTimeText?: string
}

/*
Is this for background events too!!??
*/

// should not be a purecomponent
export class StandardEvent extends BaseComponent<StandardEventProps> {
  // memo
  private buildPublicEvent = memoize(
    (context: ViewContext, eventDef: EventDef, eventInstance: EventInstance) => new EventImpl(context, eventDef, eventInstance)
  )

  // ref
  private el: HTMLElement

  render() {
    const { props, context } = this
    const { options } = context
    const { eventRange } = props
    const eventUi = eventRange.ui
    const timeFormat = options.eventTimeFormat || props.defaultTimeFormat
    const timeText = props.forcedTimeText ?? buildEventRangeTimeText(
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

    const renderProps: EventContentArg = {
      // make stable. everything else atomic
      // FYI, eventRange unfortunately gets reconstructed a lot, but def/instance is stable
      event: this.buildPublicEvent(context, eventRange.def, eventRange.instance),

      view: context.viewApi,
      timeText: timeText,
      textColor: eventUi.textColor,
      backgroundColor: eventUi.backgroundColor,
      borderColor: eventUi.borderColor,
      isDraggable: !props.disableDragging && computeEventRangeDraggable(eventRange, context),
      isStartResizable: !props.disableResizing && props.isStart && eventUi.durationEditable && options.eventResizableFromStart,
      isEndResizable: !props.disableResizing && props.isEnd && eventUi.durationEditable,
      isMirror: Boolean(props.isDragging || props.isResizing || props.isDateSelecting),
      isStart: Boolean(props.isStart),
      isEnd: Boolean(props.isEnd),
      isPast: Boolean(props.isPast), // TODO: don't cast. getDateMeta does it
      isFuture: Boolean(props.isFuture), // TODO: don't cast. getDateMeta does it
      isToday: Boolean(props.isToday), // TODO: don't cast. getDateMeta does it
      isSelected: Boolean(props.isSelected),
      isDragging: Boolean(props.isDragging),
      isResizing: Boolean(props.isResizing),
      isListItem: props.isListItem || false,
      timeClassName: joinArrayishClassNames(options.eventTimeClassNames),
      titleClassName: joinArrayishClassNames(options.eventTitleClassNames),
      titleOuterClassName: joinArrayishClassNames(options.eventTitleOuterClassNames),
    }

    // TODO: we'd like to put this in EventContentArg, but it needs EventContentArg renderProps!
    const colorClassNames = generateClassName(options.eventColorClassNames, renderProps)

    return (
      <ContentContainer<EventContentArg>
        tag={tag}
        attrs={{
          ...props.attrs,
          ...attrs,
        }}
        className={joinClassNames(
          props.className,
          ...eventUi.classNames,
        )}
        style={{
          borderColor: eventUi.borderColor,
          backgroundColor: colorClassNames
            ? undefined // color will be injected below
            : eventUi.backgroundColor, // TODO: move to just "color"
        }}
        elRef={this.handleEl}
        renderProps={renderProps}
        generatorName="eventContent"
        customGenerator={options.eventContent}
        defaultGenerator={renderInnerContent}
        classNameGenerator={options.eventClassNames}
        didMount={options.eventDidMount}
        willUnmount={options.eventWillUnmount}
      >
        {(InnerContent) => (
          <Fragment>
            {Boolean(renderProps.isStartResizable) && (
              <div
                className={joinArrayishClassNames(
                  'fc-event-resizer fc-event-resizer-start', // these classnames required for dnd
                  options.eventResizerClassNames,
                  options.eventResizerStartClassNames,
                )}
              />
            )}
            {Boolean(colorClassNames) && (
              <div
                className={colorClassNames}
                style={{
                  backgroundColor: renderProps.backgroundColor, // TODO: move to just "color"
                }}
              />
            )}
            <InnerContent
              tag="div"
              className={joinArrayishClassNames(options.eventInnerClassNames)}
              style={{
                color: renderProps.textColor,
              }}
            />
            {Boolean(renderProps.isEndResizable) && (
              <div
                className={joinArrayishClassNames(
                  "fc-event-resizer fc-event-resizer-end", // these classnames required for dnd
                  options.eventResizerClassNames,
                  options.eventResizerEndClassNames,
                )}
              />
            )}
          </Fragment>
        )}
      </ContentContainer>
    )
  }

  handleEl = (el: HTMLElement | null) => {
    this.el = el

    if (el) {
      setElEventRange(el, this.props.eventRange)
    }
  }

  componentDidUpdate(prevProps: StandardEventProps): void {
    if (this.el && this.props.eventRange !== prevProps.eventRange) {
      setElEventRange(this.el, this.props.eventRange)
    }
  }
}

function renderInnerContent(innerProps: EventContentArg) {
  return (
    <Fragment>
      {innerProps.timeText && (
        <div className={innerProps.timeClassName}>{innerProps.timeText}</div>
      )}
      <div className={innerProps.titleOuterClassName}>
        <div className={innerProps.titleClassName}>
          {innerProps.event.title || <Fragment>&nbsp;</Fragment>}
        </div>
      </div>
    </Fragment>
  )
}
