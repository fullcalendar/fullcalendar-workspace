import { memo, useLayoutEffect, useMemo, useRef, type ComponentType, type ReactNode } from 'react'
import { DateFormatter, DateMarker } from '@full-ui/headless-calendar'
import {
  buildEventRangeTimeText, computeEventRangeDraggable, EventDisplayInfo, EventTextInfo, EventRenderRange,
  getEventTagAndAttrs, setElEventRange,
} from '../../event-segs/event-rendering'
import { CustomContent } from '../../render-hook/CustomContent'
import { ElRef } from '../../render-hook/el-props'
import { useViewContext } from '../../context/useViewContext'
import { useViewOptions } from '../../context/useGranularContexts'
import { useMountHooks } from '../../render-hook/useMountHooks'
import { EventImpl } from '../../api/EventImpl'
import { ContentGenerator, generateClassName } from '../../render-hook/render-hook-types'
import { joinClassNames } from '../../util/html'
import { setRef } from '../../util/vdom'
import classNames from '../../styles.module.css'
import { Dictionary } from '../../util/object'
import { ViewOptionsRefined } from '../../options/options'

/*
Foreground events, as composed components. Each variant declares its class layers, geometry and
body, instead of one component switching on a display mode. Things that differ between callers of the same
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

// Shell and variants
// -------------------------------------------------------------------------------------------------

export interface ForegroundEventProps extends EventProps {
  variant: EventVariant
}

/*
A variant is data plus a composed body. The shell owns the outer element and its mount hooks, so a
caller switching an event between variants (DayGrid, per event) swaps only the body, and doesn't
remount the element or re-fire eventDidMount/eventWillUnmount
*/
export interface EventVariant {
  layers: EventLayer[] // class-option prefixes after `event`
  className: string
  getTitleClassName?: (options: ViewOptionsRefined) => string | undefined
  Body: ComponentType<EventPartProps>
}

export const ForegroundEvent = memo((props: ForegroundEventProps) => {
  const options = useViewOptions()
  const { variant } = props
  const { Body } = variant
  const display = useEventDisplay(props, variant.layers, {
    titleClassName: variant.getTitleClassName?.(options),
  })

  return (
    <EventEl props={props} display={display} className={variant.className}>
      <Body props={props} display={display} />
    </EventEl>
  )
})

// DayGrid block events, the TimeGrid all-day row, Timeline
export const rowEventVariant: EventVariant = {
  layers: ['blockEvent', 'rowEvent'],
  className: classNames.flexRow,
  getTitleClassName: (options) => options.rowEventTitleSticky ? classNames.stickyS : undefined,
  Body: function RowEventBody({ props, display }: EventPartProps) {
    const options = useViewOptions()

    return (
      <>
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
      </>
    )
  },
}

// TimeGrid timed events
export const columnEventVariant: EventVariant = {
  layers: ['blockEvent', 'columnEvent'],
  className: classNames.flexCol,
  getTitleClassName: (options) => options.columnEventTitleSticky ? classNames.stickyT : undefined,
  Body: function ColumnEventBody({ props, display }: EventPartProps) {
    return (
      <>
        {display.renderProps.isSelected && <div className={classNames.hitX} />}
        <EventEdge edge="start" axis="y" props={props} display={display} />
        <EventInner props={props} display={display} />
        <EventEdge edge="end" axis="y" props={props} display={display} />
      </>
    )
  },
}

// List view, DayGrid dot events
export const listItemEventVariant: EventVariant = {
  layers: ['listItemEvent'],
  className: classNames.flexRow,
  Body: function ListItemEventBody({ props, display }: EventPartProps) {
    return (
      <>
        <EventEdge edge="start" axis="x" props={props} display={display} />
        <EventInner props={props} display={display} />
        <EventEdge edge="end" axis="x" props={props} display={display} />
      </>
    )
  },
}

// Shared computation
// -------------------------------------------------------------------------------------------------

// option-name prefixes, after the `event` layer every variant has
export type EventLayer = 'blockEvent' | 'rowEvent' | 'columnEvent' | 'listItemEvent'

export interface EventDisplay {
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

export interface EventPartProps {
  props: EventProps
  display: EventDisplay
}

// The outer element. eventClass and the event mount hooks apply here
function EventEl({ props, display, className, children }: EventPartProps & {
  className: string
  children: ReactNode
}) {
  const options = useViewOptions()
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
  const options = useViewOptions()

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
  const options = useViewOptions()
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
