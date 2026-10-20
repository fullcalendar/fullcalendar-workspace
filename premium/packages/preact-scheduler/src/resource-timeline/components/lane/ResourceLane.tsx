import { joinClassNames } from '@fullcalendar/preact/public-api'
import { BaseComponent, memoize, memoizeObjArg, CustomContent, generateClassName, useRenderHookEl, useViewContext, watchHeight, setRef, afterSize, DateProfile, DateMarker, DateRange, EventStore, EventUiHash, DateSpan, EventInteractionState } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { type ReactNode, type Ref } from 'react'
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

export class ResourceLane extends BaseComponent<ResourceLaneProps> {
  // memo
  private refineRenderProps = memoizeObjArg(refineResourceLaneRenderProps)
  private buildDateSpanProps = memoize(buildResourceDateSpanProps)
  private buildEventRenderProps = memoize(buildResourceEventRenderProps)

  // internal
  private _isUnmounting: boolean
  private disconnectTopHeight?: () => void
  private disconnectBottomHeight?: () => void
  private topHeight?: number
  private bottomHeight?: number
  private eventsHeight?: number
  private slicer = new TimelineLaneSlicer()

  render() {
    let { props, context } = this
    let { resource } = props
    let { options } = context
    let renderProps = this.refineRenderProps({
      resource,
      context,
      eventOverlap: Boolean(options.eventOverlap),
    })
    let eventRenderProps = this.buildEventRenderProps(renderProps.resource)

    /* sliced */

    let slicedProps = this.slicer.sliceProps(
      props,
      props.dateProfile,
      props.tDateProfile.isTimeScale ? null : options.nextDayThreshold,
      context, // wish we didn't have to pass in the rest of the args...
      props.dateProfile,
      context.dateProfileGenerator,
      props.tDateProfile,
      context.dateEnv,
    )

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
            elRef={this.handleTopEl}
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
            dateSpanProps={this.buildDateSpanProps(resource.id)}
            renderProps={eventRenderProps}

            // dimensions
            slotWidth={props.slotWidth}

            // virtualization
            clipStart={props.clipStart}
            clipEnd={props.clipEnd}

            // ref
            heightRef={this.handleEventsHeight}
          />
          <CustomContent
            tag='div'
            elRef={this.handleBottomEl}
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
  }

  handleEventsHeight = (eventsHeight: number) => { // already executing "after size"
    if (this._isUnmounting) return
    this.eventsHeight = eventsHeight
    afterSize(this.handleHeight)
  }

  handleTopEl = (topEl: HTMLElement) => {
    if (this.disconnectTopHeight) {
      this.disconnectTopHeight()
      this.disconnectTopHeight = undefined
    }
    if (topEl) {
      this.disconnectTopHeight = watchHeight(topEl, (topHeight) => {
        if (this._isUnmounting) return
        this.topHeight = topHeight
        afterSize(this.handleHeight)
      })
    }
  }

  handleBottomEl = (footerEl: HTMLElement) => {
    if (this.disconnectBottomHeight) {
      this.disconnectBottomHeight()
      this.disconnectBottomHeight = undefined
    }
    if (footerEl) {
      this.disconnectBottomHeight = watchHeight(footerEl, (bottomHeight) => {
        if (this._isUnmounting) return
        this.bottomHeight = bottomHeight
        afterSize(this.handleHeight)
      })
    }
  }

  handleHeight = () => {
    if (this._isUnmounting) return
    const { topHeight, bottomHeight, eventsHeight } = this

    if (topHeight != null && bottomHeight != null && eventsHeight != null) {
      setRef(this.props.heightRef, topHeight + bottomHeight + eventsHeight)
    }
  }

  componentDidMount(): void {
    this._isUnmounting = false
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
  }
}

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
