import { memo, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { DateFormatter, DateMarker } from '@full-ui/headless-calendar'
import {
  buildEventRangeTimeText, computeEventRangeDraggable, EventDisplayInfo, EventTextInfo, EventRenderRange,
  getEventTagAndAttrs, setElEventRange,
} from '../component-util/event-rendering'
import { generateClassName } from '../content-inject/ContentContainer'
import { CustomContent } from '../content-inject/CustomContent'
import { ElRef } from '../content-inject/ContentInjector'
import { useViewContext } from '../hooks/useViewContext'
import { useMountHooks } from '../hooks/useMountHooks'
import { EventImpl } from '../api/EventImpl'
import { ContentGenerator } from './render-hook'
import { joinClassNames } from '../util/html'
import { setRef } from '../vdom-util'
import classNames from '../styles.module.css'
import { Dictionary, ViewOptionsRefined } from '../options'

/*
Foreground events, as composed components. Each variant declares its class layers and geometry,
instead of one component switching on a display mode. Things that differ between callers of the same
variant (dragging, resizing, z-indexes, liquid inner) stay props.
See planning/phase-4-event-pilot.md
*/

export interface EventProps {
  elRef?: ElRef
  attrs?: any
  className?: string
  eventRange: EventRenderRange // timed/whole-day span
  slicedStart?: DateMarker // view-sliced timed/whole-day span
  slicedEnd?: DateMarker // view-sliced timed/whole-day span
  isStart: boolean // seg could have been split into small pieces
  isEnd: boolean // "
  isFirst?: boolean
  isLast?: boolean
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
  renderProps?: Dictionary // so can include a resource
}

// Variants
// -------------------------------------------------------------------------------------------------

// DayGrid block events, the TimeGrid all-day row, Timeline
export const RowEvent = memo((props: EventProps) => {
  const { options } = useViewContext()
  const display = useEventDisplay(props, ['blockEvent', 'rowEvent'], {
    titleClassName: options.rowEventTitleSticky ? classNames.stickyS : undefined,
  })

  return (
    <EventEl props={props} display={display} className={classNames.flexRow}>
      {display.renderProps.isSelected && <div className={classNames.hitY} />}
      <EventEdge
        edge="start"
        axis="x"
        props={props}
        display={display}
        content={options.rowEventBeforeContent}
      />
      <EventInner props={props} display={display} />
      <EventEdge
        edge="end"
        axis="x"
        props={props}
        display={display}
        content={options.rowEventAfterContent}
      />
    </EventEl>
  )
})

// TimeGrid timed events
export const ColumnEvent = memo((props: EventProps) => {
  const { options } = useViewContext()
  const display = useEventDisplay(props, ['blockEvent', 'columnEvent'], {
    titleClassName: options.columnEventTitleSticky ? classNames.stickyT : undefined,
  })

  return (
    <EventEl props={props} display={display} className={classNames.flexCol}>
      {display.renderProps.isSelected && <div className={classNames.hitX} />}
      <EventEdge edge="start" axis="y" props={props} display={display} />
      <EventInner props={props} display={display} />
      <EventEdge edge="end" axis="y" props={props} display={display} />
    </EventEl>
  )
})

// List view, DayGrid dot events
export const ListItemEvent = memo((props: EventProps) => {
  const display = useEventDisplay(props, ['listItemEvent'], {})

  return (
    <EventEl props={props} display={display} className={classNames.flexRow}>
      <EventEdge edge="start" axis="x" props={props} display={display} />
      <EventInner props={props} display={display} />
      <EventEdge edge="end" axis="x" props={props} display={display} />
    </EventEl>
  )
})

// Shared computation
// -------------------------------------------------------------------------------------------------

// option-name prefixes, after the `event` layer every variant has
type EventLayer = 'blockEvent' | 'rowEvent' | 'columnEvent' | 'listItemEvent'

interface EventDisplay {
  tag: string
  attrs: any
  renderProps: EventDisplayInfo
  isDraggable: boolean
  layers: EventLayer[]
}

function useEventDisplay(
  props: EventProps,
  layers: EventLayer[],
  extra: { titleClassName?: string },
): EventDisplay {
  const context = useViewContext()
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

  // stable while def/instance are, even though eventRange gets reconstructed a lot
  const eventApi = useMemo(
    () => new EventImpl(context, eventRange.def, eventRange.instance),
    [context, eventRange.def, eventRange.instance],
  )
  // stable, so <CustomContent>'s shallow renderProps check can skip re-running eventContent
  const eventOptions = useMemo(
    () => ({ eventOverlap: Boolean(options.eventOverlap) }),
    [options.eventOverlap],
  )

  const isDraggable = !props.disableDragging && computeEventRangeDraggable(eventRange, context)
  const subcontentRenderProps: EventTextInfo = {
    ...props.renderProps, // first, so built-in props take precedence
    event: eventApi,
    isNarrow: props.isNarrow || false,
    isShort: props.isShort || false,
    timeText,
  }
  const renderProps: EventDisplayInfo = {
    ...props.renderProps, // first, so built-in props take precedence
    event: eventApi,
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
    isFirst: Boolean(props.isFirst),
    isLast: Boolean(props.isLast),
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
    timeClass: buildLayerClassName(options, ['event', ...layers], 'Time', subcontentRenderProps),
    titleClass: joinClassNames(
      buildLayerClassName(options, ['event', ...layers], 'Title', subcontentRenderProps),
      extra.titleClassName,
    ),
    options: eventOptions,
  }

  return { tag, attrs, renderProps, isDraggable, layers }
}

/*
Joins a part's class options across layers, e.g. eventInnerClass, blockEventInnerClass,
rowEventInnerClass. Layers are data, so the public option cascade stays exactly as it is
*/
function buildLayerClassName(
  options: ViewOptionsRefined,
  layers: ('event' | EventLayer)[],
  part: '' | 'Inner' | 'Before' | 'After' | 'Time' | 'Title',
  renderProps: any,
): string {
  return joinClassNames(
    ...layers.map((layer) => generateClassName((options as any)[`${layer}${part}Class`], renderProps)),
  )
}

// Parts
// -------------------------------------------------------------------------------------------------

interface EventPartProps {
  props: EventProps
  display: EventDisplay
}

// The outer element. eventClass and the event mount hooks apply here
function EventEl({ props, display, className, children }: EventPartProps & {
  className: string
  children: ReactNode
}) {
  const { options } = useViewContext()
  const { eventRange } = props
  const { renderProps, isDraggable } = display
  const elRef = useRef<HTMLElement | null>(null)

  // the ref callback must be stable, or React would detach and re-attach it on every commit.
  // assigned during render, because the ref callback runs during the commit
  const latestRef = useRef({ elRef: props.elRef, eventRange })
  latestRef.current = { elRef: props.elRef, eventRange }
  const handleElRef = useRef<(el: HTMLElement | null) => void>(null)
  handleElRef.current ??= (el: HTMLElement | null) => {
    elRef.current = el
    setRef(latestRef.current.elRef, el)

    if (el) {
      setElEventRange(el, latestRef.current.eventRange)
    }
  }

  useLayoutEffect(() => {
    if (elRef.current) {
      setElEventRange(elRef.current, eventRange)
    }
  }, [eventRange])

  // after <CustomContent>'s layout effects, so the content is inside the element
  useMountHooks(elRef, options.eventDidMount, options.eventWillUnmount, renderProps)

  const Tag = display.tag as any

  return (
    <Tag
      {...props.attrs}
      {...display.attrs}
      // HACK because this event-element gets attached to root during some dragging
      dir={(props.isDragging && options.direction === 'rtl') ? 'rtl' : undefined}
      ref={handleElRef.current}
      className={joinClassNames(
        generateClassName(options.eventClass, renderProps),
        buildLayerClassName(options, display.layers, '', renderProps),
        eventRange.ui.className,
        props.className,
        className,
        (eventRange.def.url || isDraggable) && classNames.cursorPointer,
        classNames.internalEvent,
        props.isMirror && classNames.internalEventMirror,
        isDraggable && classNames.internalEventDraggable,
        renderProps.isSelected && classNames.internalEventSelected,
        (renderProps.isStartResizable || renderProps.isEndResizable) && classNames.internalEventResizable,
      )}
      style={{
        '--fc-event-color': renderProps.color,
        '--fc-event-contrast-color': renderProps.contrastColor,
      }}
    >
      {children}
    </Tag>
  )
}

// The slot eventContent fills. Defaults to the time and title
function EventInner({ props, display }: EventPartProps) {
  const { options } = useViewContext()

  return (
    <CustomContent<EventDisplayInfo>
      tag="div"
      className={joinClassNames(
        buildLayerClassName(options, ['event', ...display.layers], 'Inner', display.renderProps),
        !props.disableLiquid && classNames.liquid, // timegrid hack
        !props.disableZindexes && classNames.z0,
      )}
      renderProps={display.renderProps}
      generatorName="eventContent"
      generator={options.eventContent}
      fallback={renderInnerContent}
    />
  )
}

// The "before" or "after" element: a resizer, or a decoration like an arrow
function EventEdge({ edge, axis, props, display, content }: EventPartProps & {
  edge: 'start' | 'end'
  axis: 'x' | 'y'
  content?: ContentGenerator<EventDisplayInfo>
}) {
  const { options } = useViewContext()
  const { renderProps } = display
  const isStart = edge === 'start'
  const className = buildLayerClassName(
    options,
    ['event', ...display.layers],
    isStart ? 'Before' : 'After',
    renderProps,
  )
  const isResizable = isStart ? renderProps.isStartResizable : renderProps.isEndResizable

  if (!className && !content) {
    return null
  }

  return (
    <div
      className={joinClassNames(
        className,
        !props.disableZindexes && classNames.z1,
        isResizable && joinClassNames(
          axis === 'y'
            ? (isStart ? classNames.cursorResizeT : classNames.cursorResizeB)
            : (isStart ? classNames.cursorResizeS : classNames.cursorResizeE),
          // these classnames required for dnd
          classNames.internalEventResizer,
          isStart ? classNames.internalEventResizerStart : classNames.internalEventResizerEnd,
        ),
      )}
    >
      {content && (
        <CustomContent<EventDisplayInfo>
          tag="div"
          style={DISPLAY_CONTENTS}
          attrs={ARIA_HIDDEN}
          renderProps={renderProps}
          generatorName={undefined}
          generator={content}
        />
      )}
      {Boolean(isResizable && renderProps.isSelected) && (
        <div className={classNames.hit} />
      )}
    </div>
  )
}

const DISPLAY_CONTENTS = { display: 'contents' }
const ARIA_HIDDEN = { 'aria-hidden': true }

function renderInnerContent(innerProps: EventDisplayInfo) {
  return (
    <>
      {innerProps.timeText && (
        <div className={innerProps.timeClass}>{innerProps.timeText}</div>
      )}
      <div className={innerProps.titleClass}>
        {innerProps.event.title || <>&nbsp;</>}
      </div>
    </>
  )
}
