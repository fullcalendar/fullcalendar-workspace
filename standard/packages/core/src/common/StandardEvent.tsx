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
import { joinArrayishClassNames, joinClassNames } from '../util/html.js'
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
  isNarrow?: boolean // default false
  isShort?: boolean // default false
  level?: number // default 0
  forcedTimeText?: string
  disableLiquid?: boolean // for inner-element
  disableZindexes?: boolean
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
    const [tag, attrs, isInteractive] = getEventTagAndAttrs(eventRange, context)

    const eventApi = this.buildPublicEvent(context, eventRange.def, eventRange.instance)
    const isDraggable = !props.disableDragging && computeEventRangeDraggable(eventRange, context)
    const isBlock = /row|column/.test(props.display)
    const subcontentRenderProps = { // TODO: spread with renderProps?
      event: eventApi,
      isNarrow: props.isNarrow || false,
      isShort: props.isShort || false,
    }
    const renderProps: EventDisplayData = {
      event: eventApi, // make stable. everything else atomic. FYI, eventRange unfortunately gets reconstructed a lot, but def/instance is stable
      view: context.viewApi,
      timeText: timeText,
      color: eventUi.color || options.eventColor,
      contrastColor: eventUi.contrastColor || options.eventContrastColor,
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
      isInteractive,
      isNarrow: props.isNarrow || false,
      isShort: props.isShort || false,
      level: props.level || 0,
      timeClass: joinClassNames(
        generateClassName(options.eventTimeClass, subcontentRenderProps),
        isBlock && generateClassName(options.blockEventTimeClass, subcontentRenderProps),
        props.display === 'row' && generateClassName(options.rowEventTimeClass, subcontentRenderProps),
        props.display === 'column' && generateClassName(options.columnEventTimeClass, subcontentRenderProps),
        props.display === 'list-item' && generateClassName(options.listItemEventTimeClass, subcontentRenderProps),
      ),
      titleClass: joinClassNames(
        generateClassName(options.eventTitleClass, subcontentRenderProps),
        isBlock && generateClassName(options.blockEventTitleClass, subcontentRenderProps),
        props.display === 'row' && generateClassName(options.rowEventTitleClass, subcontentRenderProps),
        props.display === 'column' && generateClassName(options.columnEventTitleClass, subcontentRenderProps),
        props.display === 'list-item' && generateClassName(options.listItemEventTitleClass, subcontentRenderProps),
        props.display === 'row' && options.rowEventTitleSticky && classNames.stickyS,
        props.display === 'column' && options.columnEventTitleSticky && classNames.stickyT,
      ),
      options: { eventOverlap: Boolean(options.eventOverlap) },
    }
    const outerClassName = joinArrayishClassNames( // already includes eventClass below
      isBlock && generateClassName(options.blockEventClass, renderProps),
      props.display === 'row' && generateClassName(options.rowEventClass, renderProps),
      props.display === 'column' && generateClassName(options.columnEventClass, renderProps),
      props.display === 'list-item' && generateClassName(options.listItemEventClass, renderProps),
      eventUi.className,
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
    const beforeClassName = joinClassNames(
      generateClassName(options.eventBeforeClass, renderProps),
      isBlock && generateClassName(options.blockEventBeforeClass, renderProps),
      props.display === 'row' && generateClassName(options.rowEventBeforeClass, renderProps),
      props.display === 'column' && generateClassName(options.columnEventBeforeClass, renderProps),
      props.display === 'list-item' && generateClassName(options.listItemEventBeforeClass, renderProps),
    )
    const afterClassName = joinClassNames(
      generateClassName(options.eventAfterClass, renderProps),
      isBlock && generateClassName(options.blockEventAfterClass, renderProps),
      props.display === 'row' && generateClassName(options.rowEventAfterClass, renderProps),
      props.display === 'column' && generateClassName(options.columnEventAfterClass, renderProps),
      props.display === 'list-item' && generateClassName(options.listItemEventAfterClass, renderProps),
    )
    const innerClassName = joinClassNames(
      generateClassName(options.eventInnerClass, renderProps),
      isBlock && generateClassName(options.blockEventInnerClass, renderProps),
      props.display === 'row' && generateClassName(options.rowEventInnerClass, renderProps),
      props.display === 'column' && generateClassName(options.columnEventInnerClass, renderProps),
      props.display === 'list-item' && generateClassName(options.listItemEventInnerClass, renderProps),
      !props.disableLiquid && classNames.liquid, // timegrid hack
    )

    const beforeContent = props.display === 'row' && options.rowEventBeforeContent
    const afterContent = props.display === 'row' && options.rowEventAfterContent

    return (
      <ContentContainer<EventDisplayData>
        tag={tag}
        attrs={{
          ...props.attrs,
          ...attrs,
          // HACK because this event-element gets attached to root during some dragging
          dir: (props.isDragging && options.direction === 'rtl') ? 'rtl' : undefined,
        }}
        className={outerClassName}
        style={{
          '--fc-event-color': renderProps.color,
          '--fc-event-contrast-color': renderProps.contrastColor,
        }}
        elRef={this.handleEl}
        renderProps={renderProps}
        generatorName="eventContent"
        customGenerator={options.eventContent}
        defaultGenerator={renderInnerContent}
        classNameGenerator={options.eventClass}
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
            {(beforeClassName || beforeContent) && (
              <div
                className={joinClassNames(
                  beforeClassName,
                  !props.disableZindexes && classNames.z1,
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
                {beforeContent && (
                  <ContentContainer<EventDisplayData>
                    tag='div'
                    style={{ display: 'contents' }}
                    attrs={{ 'aria-hidden': true }}
                    renderProps={renderProps}
                    generatorName={undefined}
                    customGenerator={beforeContent}
                  />
                )}
                {Boolean(renderProps.isStartResizable && renderProps.isSelected) && (
                  <div className={classNames.hit} />
                )}
              </div>
            )}
            {/* inner element */}
            <InnerContent
              tag="div"
              className={joinClassNames(
                innerClassName,
                !props.disableZindexes && classNames.z0,
              )}
            />
            {/* "after" element (resizer or left-arrow) */}
            {(afterClassName || afterContent) && (
              <div
                className={joinClassNames(
                  afterClassName,
                  !props.disableZindexes && classNames.z1,
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
                {afterContent && (
                  <ContentContainer<EventDisplayData>
                    tag='div'
                    style={{ display: 'contents' }}
                    attrs={{ 'aria-hidden': true }}
                    renderProps={renderProps}
                    generatorName={undefined}
                    customGenerator={afterContent}
                  />
                )}
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
        <div className={innerProps.timeClass}>{innerProps.timeText}</div>
      )}
      <div className={innerProps.titleClass}>
        {innerProps.event.title || <Fragment>&nbsp;</Fragment>}
      </div>
    </Fragment>
  )
}
