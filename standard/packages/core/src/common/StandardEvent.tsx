import { createElement, Fragment } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { buildEventRangeTimeText, computeEventRangeDraggable, EventDisplayData, EventRenderRange, getEventTagAndAttrs, setElEventRange } from '../component-util/event-rendering.js'
import { DateFormatter } from '../datelib/DateFormatter.js'
import { ContentContainer, generateClassName } from '../content-inject/ContentContainer.js'
import { ElRef } from '../content-inject/ContentInjector.js'
import { DateMarker } from '../datelib/marker.js'
import { memoize } from '../util/memoize.js'
import { EventDef } from '../structs/event-def.js'
import { EventInstance } from '../structs/event-instance.js'
import { EventImpl } from '../api/EventImpl.js'
import { ViewContext } from '../ViewContext.js'
import { joinClassNames } from '../util/html.js'
import classNames from '../internal-classnames.js'

export interface StandardEventProps {
  elRef?: ElRef
  attrs?: any
  className?: string
  display: 'list-item' | 'row' | 'column'
  eventRange: EventRenderRange // timed/whole-day span
  slicedStart?: DateMarker // view-sliced timed/whole-day span
  slicedEnd?: DateMarker // view-sliced timed/whole-day span
  isStart: boolean // seg could have been split into small pieces
  isEnd: boolean // "
  isDragging: boolean // rename to isMirrorDragging? make optional?
  isResizing: boolean // rename to isMirrorResizing? make optional?
  isMirror: boolean
  isSelected: boolean
  isPast: boolean
  isFuture: boolean
  isToday: boolean
  disableDragging?: boolean // defaults false
  disableResizing?: boolean // defaults false
  defaultTimeFormat: DateFormatter
  defaultDisplayEventTime?: boolean // default true
  defaultDisplayEventEnd?: boolean // default true
  isCompact?: boolean // default false
  isSpacious?: boolean // default false
  level?: number // default 0
  forcedTimeText?: string
  disableLiquid?: boolean // for inner-element
}

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

    const eventApi = this.buildPublicEvent(context, eventRange.def, eventRange.instance)
    const isDraggable = !props.disableDragging && computeEventRangeDraggable(eventRange, context)
    const isBlock = /row|column/.test(props.display)
    const subcontentRenderProps = {
      event: eventApi,
      isCompact: props.isCompact || false,
    }
    const renderProps: EventDisplayData = {
      event: eventApi, // make stable. everything else atomic. FYI, eventRange unfortunately gets reconstructed a lot, but def/instance is stable
      view: context.viewApi,
      timeText: timeText,
      color: eventUi.color,
      contrastColor: eventUi.contrastColor,
      isDraggable,
      isStartResizable: !props.disableResizing && props.isStart && eventUi.durationEditable && options.eventResizableFromStart,
      isEndResizable: !props.disableResizing && props.isEnd && eventUi.durationEditable,
      isMirror: props.isMirror,
      isStart: Boolean(props.isStart),
      isEnd: Boolean(props.isEnd),
      isPast: Boolean(props.isPast), // TODO: don't cast. getDateMeta does it
      isFuture: Boolean(props.isFuture), // TODO: don't cast. getDateMeta does it
      isToday: Boolean(props.isToday), // TODO: don't cast. getDateMeta does it
      isSelected: Boolean(props.isSelected),
      isDragging: Boolean(props.isDragging),
      isResizing: Boolean(props.isResizing),
      isCompact: props.isCompact || false,
      isSpacious: props.isSpacious || false,
      level: props.level || 0,
      timeClassName: joinClassNames(
        generateClassName(options.eventTimeClassNames, subcontentRenderProps),
        isBlock && generateClassName(options.blockEventTimeClassNames, subcontentRenderProps),
        props.display === 'row' && generateClassName(options.rowEventTimeClassNames, subcontentRenderProps),
        props.display === 'column' && generateClassName(options.columnEventTimeClassNames, subcontentRenderProps),
        props.display === 'list-item' && generateClassName(options.listItemEventTimeClassNames, subcontentRenderProps),
      ),
      titleClassName: joinClassNames(
        generateClassName(options.eventTitleClassNames, subcontentRenderProps),
        isBlock && generateClassName(options.blockEventTitleClassNames, subcontentRenderProps),
        props.display === 'row' && generateClassName(options.rowEventTitleClassNames, subcontentRenderProps),
        props.display === 'column' && generateClassName(options.columnEventTitleClassNames, subcontentRenderProps),
        props.display === 'list-item' && generateClassName(options.listItemEventTitleClassNames, subcontentRenderProps),
      ),
    }
    const outerClassNames = joinClassNames( // already includes eventClassNames below
      isBlock && generateClassName(options.blockEventClassNames, renderProps),
      props.display === 'row' && generateClassName(options.rowEventClassNames, renderProps),
      props.display === 'column' && generateClassName(options.columnEventClassNames, renderProps),
      props.display === 'list-item' && generateClassName(options.listItemEventClassNames, renderProps),
      ...eventUi.classNames,
      props.className,
      props.display === 'column'
        ? classNames.flexCol
        : classNames.flexRow,
      (eventRange.def.url || isDraggable) && classNames.cursorPointer,
      classNames.internalEvent,
      props.isMirror && classNames.internalEventMirror,
      isDraggable && classNames.internalEventDraggable,
      renderProps.isSelected && classNames.internalEventSelected,
      (renderProps.isStartResizable || renderProps.isEndResizable) && classNames.internalEventResizable,
    )
    const beforeClassNames = joinClassNames(
      generateClassName(options.eventBeforeClassNames, renderProps),
      isBlock && generateClassName(options.blockEventBeforeClassNames, renderProps),
      props.display === 'row' && generateClassName(options.rowEventBeforeClassNames, renderProps),
      props.display === 'column' && generateClassName(options.columnEventBeforeClassNames, renderProps),
      props.display === 'list-item' && generateClassName(options.listItemEventBeforeClassNames, renderProps),
    )
    const afterClassNames = joinClassNames(
      generateClassName(options.eventAfterClassNames, renderProps),
      isBlock && generateClassName(options.blockEventAfterClassNames, renderProps),
      props.display === 'row' && generateClassName(options.rowEventAfterClassNames, renderProps),
      props.display === 'column' && generateClassName(options.columnEventAfterClassNames, renderProps),
      props.display === 'list-item' && generateClassName(options.listItemEventAfterClassNames, renderProps),
    )
    const colorClassNames = joinClassNames(
      generateClassName(options.eventColorClassNames, renderProps),
      isBlock && generateClassName(options.blockEventColorClassNames, renderProps),
      props.display === 'row' && generateClassName(options.rowEventColorClassNames, renderProps),
      props.display === 'column' && generateClassName(options.columnEventColorClassNames, renderProps),
      props.display === 'list-item' && generateClassName(options.listItemEventColorClassNames, renderProps),
    )
    const innerClassNames = joinClassNames(
      generateClassName(options.eventInnerClassNames, renderProps),
      isBlock && generateClassName(options.blockEventInnerClassNames, renderProps),
      props.display === 'row' && generateClassName(options.rowEventInnerClassNames, renderProps),
      props.display === 'column' && generateClassName(options.columnEventInnerClassNames, renderProps),
      props.display === 'list-item' && generateClassName(options.listItemEventInnerClassNames, renderProps),
      !props.disableLiquid && classNames.liquid, // timegrid hack
    )

    return (
      <ContentContainer<EventDisplayData>
        tag={tag}
        attrs={{
          ...props.attrs,
          ...attrs,
        }}
        className={outerClassNames}
        style={{
          '--fc-event-color': eventUi.color,
          '--fc-event-contrast-color': eventUi.contrastColor,
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
            {/* hit expander */}
            {Boolean(renderProps.isSelected && isBlock) && (
              <div
                className={
                  props.display === 'column'
                    ? classNames.hitX
                    : classNames.hitY
                }
              />
            )}
            {/* "before" element (resizer or left-arrow) */}
            {beforeClassNames && (
              <div
                className={joinClassNames(
                  beforeClassNames,
                  renderProps.isStartResizable && joinClassNames(
                    props.display === 'column'
                      ? classNames.cursorResizeT
                      : classNames.cursorResizeS,
                    // these classnames required for dnd
                    classNames.internalEventResizer,
                    classNames.internalEventResizerStart,
                  )
                )}
              >
                {Boolean(renderProps.isStartResizable && renderProps.isSelected) && (
                  <div className={classNames.hit} />
                )}
              </div>
            )}
            {/* color element */}
            {colorClassNames && (
              <div className={colorClassNames} />
            )}
            {/* inner element */}
            <InnerContent
              tag="div"
              className={innerClassNames}
            />
            {/* "after" element (resizer or left-arrow) */}
            {afterClassNames && (
              <div
                className={joinClassNames(
                  afterClassNames,
                  renderProps.isEndResizable && joinClassNames(
                    props.display === 'column'
                      ? classNames.cursorResizeB
                      : classNames.cursorResizeE,
                    // these classnames required for dnd
                    classNames.internalEventResizer,
                    classNames.internalEventResizerEnd,
                  )
                )}
              >
                {Boolean(renderProps.isEndResizable && renderProps.isSelected) && (
                  <div className={classNames.hit} />
                )}
              </div>
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

function renderInnerContent(innerProps: EventDisplayData) {
  return (
    <Fragment>
      {innerProps.timeText && (
        <div className={innerProps.timeClassName}>{innerProps.timeText}</div>
      )}
      <div className={innerProps.titleClassName}>
        {innerProps.event.title || <Fragment>&nbsp;</Fragment>}
      </div>
    </Fragment>
  )
}
