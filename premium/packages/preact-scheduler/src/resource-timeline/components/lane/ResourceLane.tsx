import { joinClassNames } from '@fullcalendar/preact/public-api'
import { CustomContent, generateClassName, useLatest, useRenderHookEl, useReportedSize, useViewContext, setRef, afterSize, DateProfile, DateMarker, DateRange, EventStore, EventUiHash, DateSpan, EventInteractionState } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { memo, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import { Resource } from '../../../resource/structs/resource'
import { TimelineDateProfile } from '../../../timeline/timeline-date-profile'
import { TimelineFg } from '../../../timeline/components/TimelineFg'
import { TimelineBg } from '../../../timeline/components/TimelineBg'
import { TimelineLaneSlicer } from '../../../timeline/TimelineLaneSlicer'
import { ResourceLaneContentArgInput, ResourceLaneInfo } from '../../structs'
import { ResourceApi } from '../../../resource/public-api'
import { type AriaCellInput, buildAriaCellAttrs, getAriaCellRole } from '../../aria'

export interface ResourceLaneProps extends AriaCellInput {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  nowMs: number
  todayRange: DateRange
  borderBottom: boolean
  role?: string // aria
  className?: string

  // content
  eventStore: EventStore | null
  eventUiBases: EventUiHash
  businessHours: EventStore | null
  dateSelection: DateSpan | null
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  eventSelection: string
  resource: Resource

  // dimensions
  width?: number
  slotWidth: number | undefined

  // position
  top?: number
  height?: number
  insetInlineStart?: number

  // virtualization (optional)
  clipStart?: number
  clipEnd?: number

  // refs
  heightRef?: Ref<number>
}

export const ResourceLane = memo(function ResourceLane(props: ResourceLaneProps) {
  const context = useViewContext()
  const { resource } = props
  const { options } = context
  const eventOverlap = Boolean(options.eventOverlap)
  const renderProps = useMemo(
    () => refineResourceLaneRenderProps({ resource, context, eventOverlap }),
    [resource, context, eventOverlap],
  )
  const eventRenderProps = useMemo(
    () => buildResourceEventRenderProps(renderProps.resource),
    [renderProps.resource],
  )
  const dateSpanProps = useMemo(() => buildResourceDateSpanProps(resource.id), [resource.id])

  /* sliced */

  const [slicer] = useState(() => new TimelineLaneSlicer())
  const slicedProps = slicer.sliceProps(
    props,
    props.dateProfile,
    props.tDateProfile.isTimeScale ? null : options.nextDayThreshold,
    context, // wish we didn't have to pass in the rest of the args...
    props.dateProfile,
    context.dateProfileGenerator,
    props.tDateProfile,
    context.dateEnv,
  )

  /* height: the top and bottom content's, plus the events' */

  // true until unmount, not just after mount: children report from their layout effects, which run
  // before this one
  const isActiveRef = useRef(true)
  const heightRefRef = useLatest(props.heightRef)
  const [heights] = useState(() => {
    const heights = {
      top: undefined as number | undefined,
      bottom: undefined as number | undefined,
      events: undefined as number | undefined,
      handleHeight() {
        if (isActiveRef.current && heights.top != null && heights.bottom != null && heights.events != null) {
          setRef(heightRefRef.current, heights.top + heights.bottom + heights.events)
        }
      },
      handleEventsHeight(eventsHeight: number) { // already executing "after size"
        if (isActiveRef.current) {
          heights.events = eventsHeight
          afterSize(heights.handleHeight)
        }
      },
    }
    return heights
  })
  const handleTopEl = useReportedSize({
    watchHeight: true,
    onSize(_width, height) {
      heights.top = height
      afterSize(heights.handleHeight)
    },
  })
  const handleBottomEl = useReportedSize({
    watchHeight: true,
    onSize(_width, height) {
      heights.bottom = height
      afterSize(heights.handleHeight)
    },
  })

  useLayoutEffect(() => {
    isActiveRef.current = true

    return () => {
      isActiveRef.current = false
    }
  }, [])

  return (
    <div
      role={props.role as any} // !!!
      className={joinClassNames(
        props.className, // probably contains fillX
        classNames.flexRow,
      )}
      style={{
        top: props.top,
        width: props.width,
        insetInlineStart: props.insetInlineStart ?? props.clipStart,
      }}
    >
      <ResourceLaneCell
        attrs={{
          ...buildAriaCellAttrs(props),
          role: getAriaCellRole(props),
          'data-resource-id': resource.id,
        }}
        className={joinClassNames(
          classNames.liquid,
          classNames.noMargin,
          classNames.noPadding,
          classNames.flexCol,
          classNames.contentBox,
          classNames.borderlessX,
          classNames.borderlessTop,
          !props.borderBottom && classNames.borderlessBottom,
          classNames.rel, // for fillTop
        )}
        style={{
          height: props.height,
        }}
        renderProps={renderProps}
      >
        <TimelineBg
          tDateProfile={props.tDateProfile}
          nowDate={props.nowDate}
          nowMs={props.nowMs}
          todayRange={props.todayRange}

          // content
          bgEventSegs={slicedProps.bgEventSegs}
          businessHourSegs={slicedProps.businessHourSegs}
          dateSelectionSegs={slicedProps.dateSelectionSegs}
          eventResizeSegs={slicedProps.eventResize ? slicedProps.eventResize.segs : null}
          renderProps={eventRenderProps}

          // dimensions
          slotWidth={props.slotWidth}

          // virtualization
          clipStart={props.clipStart}
          clipEnd={props.clipEnd}
        />
        <CustomContent
          tag='div'
          elRef={handleTopEl}
          className={joinClassNames(
            classNames.noMargin,
            classNames.noShrink,
            generateClassName(options.resourceLaneTopClass, renderProps),
          )}
          renderProps={renderProps}
          generatorName='resourceLaneTopContent'
          generator={options.resourceLaneTopContent}
        />
        <TimelineFg
          dateProfile={props.dateProfile}
          tDateProfile={props.tDateProfile}
          nowDate={props.nowDate}
          nowMs={props.nowMs}
          todayRange={props.todayRange}

          // content
          fgEventSegs={slicedProps.fgEventSegs}
          eventDrag={slicedProps.eventDrag}
          eventResize={slicedProps.eventResize}
          eventSelection={slicedProps.eventSelection}
          dateSpanProps={dateSpanProps}
          renderProps={eventRenderProps}

          // dimensions
          slotWidth={props.slotWidth}

          // virtualization
          clipStart={props.clipStart}
          clipEnd={props.clipEnd}

          // ref
          heightRef={heights.handleEventsHeight}
        />
        <CustomContent
          tag='div'
          elRef={handleBottomEl}
          className={joinClassNames(
            classNames.noMargin,
            classNames.noShrink,
            generateClassName(options.resourceLaneBottomClass, renderProps),
          )}
          renderProps={renderProps}
          generatorName='resourceLaneBottomContent'
          generator={options.resourceLaneBottomContent}
        />
      </ResourceLaneCell>
    </div>
  )
})

interface ResourceLaneCellProps {
  attrs: Record<string, any>
  className: string
  style: { height: number | undefined }
  renderProps: ResourceLaneInfo
  children: ReactNode
}

// the lane's cell element, with its resourceLane* render hooks
function ResourceLaneCell({ attrs, className, style, renderProps, children }: ResourceLaneCellProps) {
  const { options } = useViewContext()
  const renderHookEl = useRenderHookEl({
    classGenerator: options.resourceLaneClass,
    didMount: options.resourceLaneDidMount,
    willUnmount: options.resourceLaneWillUnmount,
    renderProps,
  })

  return (
    <div
      {...attrs}
      ref={renderHookEl.ref}
      className={joinClassNames(renderHookEl.className, className)}
      style={style}
    >{children}</div>
  )
}

/*
For the lane's events and more-links. Memoize these, for stable references
*/
export function buildResourceDateSpanProps(resourceId: string) {
  return { resourceId }
}
export function buildResourceEventRenderProps(resource: ResourceApi) {
  return { resource }
}

export function refineResourceLaneRenderProps(input: ResourceLaneContentArgInput): ResourceLaneInfo {
  return {
    resource: new ResourceApi(input.context, input.resource),
    options: { eventOverlap: input.eventOverlap },
  }
}
