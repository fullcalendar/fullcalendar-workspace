import { EventProps } from './ForegroundEvent'
import { useMemo } from 'react'
import {
  buildEventRangeTimeText,
  computeEventRangeDraggable,
  EventDisplayInfo,
  EventTextInfo,
  getEventTagAndAttrs,
} from './event-display-info'
import { useViewContext } from '../../context/useViewContext'
import { EventImpl } from '../../api/EventImpl'
import { generateClassName } from '../../render-hook/render-hook-types'
import { joinClassNames } from '../../util/html'
import { ViewOptionsRefined } from '../../options/options'

/*
What every variant of a foreground event computes the same way: its time text, tag and attributes,
render props and layered class names
*/

// option-name prefixes, after the `event` layer every variant has
export type EventLayer = 'blockEvent' | 'rowEvent' | 'columnEvent' | 'listItemEvent'

export interface EventDisplay {
  tag: string
  attrs: any
  renderProps: EventDisplayInfo
  isDraggable: boolean
  layers: EventLayer[]
}

export function useEventDisplay(
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
export function buildLayerClassName(
  options: ViewOptionsRefined,
  layers: ('event' | EventLayer)[],
  part: '' | 'Inner' | 'Before' | 'After' | 'Time' | 'Title',
  renderProps: any,
): string {
  return joinClassNames(
    ...layers.map((layer) => generateClassName((options as any)[`${layer}${part}Class`], renderProps)),
  )
}
