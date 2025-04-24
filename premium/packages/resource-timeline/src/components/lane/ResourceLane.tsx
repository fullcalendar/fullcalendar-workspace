import { BaseComponent, memoizeObjArg, ContentContainer, watchHeight, setRef, afterSize, joinClassNames, DateProfile, DateMarker, DateRange, EventStore, EventUiHash, DateSpan, EventInteractionState, joinArrayishClassNames, generateClassName } from '@fullcalendar/core/internal'
import { createElement, Ref } from '@fullcalendar/core/preact'
import { Resource, refineRenderProps } from '@fullcalendar/resource/internal'
import { TimelineDateProfile, TimelineFg, TimelineBg, TimelineLaneSlicer } from '@fullcalendar/timeline/internal'

export interface ResourceLaneProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  borderBottom: boolean
  role?: string // aria
  rowIndex?: number // aria
  level?: number // aria
  expanded?: boolean // aria
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
  left?: number
  right?: number

  // refs
  heightRef?: Ref<number>
}

export class ResourceLane extends BaseComponent<ResourceLaneProps> {
  // memo
  private refineRenderProps = memoizeObjArg(refineRenderProps)

  // internal
  private disconnectFooterHeight?: () => void
  private eventsHeight?: number
  private footerHeight?: number
  private slicer = new TimelineLaneSlicer()

  render() {
    let { props, context } = this
    let { resource } = props
    let { options } = context
    let renderProps = this.refineRenderProps({ resource, context })

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
      <ContentContainer
        tag="div"
        attrs={{
          role: props.role as any, // !!!
          'aria-rowindex': props.rowIndex,
          'aria-level': props.level,
          'aria-expanded': props.expanded,
          'data-resource-id': resource.id,
        }}
        className={joinClassNames(
          'fc-resource fc-timeline-lane',
          props.className,
          'fc-flex-row fc-content-box',
          props.borderBottom ? 'fc-border-only-b' : 'fc-border-none',
        )}
        style={{
          top: props.top,
          left: props.left,
          right: props.right,
          width: props.width,
          height: props.height,
        }}
        renderProps={renderProps}
        generatorName="resourceLaneContent"
        customGenerator={options.resourceLaneContent}
        classNameGenerator={options.resourceLaneClassNames}
        didMount={options.resourceLaneDidMount}
        willUnmount={options.resourceLaneWillUnmount}
      >
        {(InnerContent) => (
          <div
            role='gridcell'
            className={joinClassNames(
              'fc-liquid fc-flex-col fc-rel', // fc-rel is for fc-fill-top
              options.eventOverlap
                ? 'fc-timeline-overlap-enabled'
                : 'fc-timeline-overlap-disabled',
            )}
          >
            <TimelineBg
              tDateProfile={props.tDateProfile}
              nowDate={props.nowDate}
              todayRange={props.todayRange}

              // content
              bgEventSegs={slicedProps.bgEventSegs}
              businessHourSegs={slicedProps.businessHourSegs}
              dateSelectionSegs={slicedProps.dateSelectionSegs}
              eventResizeSegs={slicedProps.eventResize ? slicedProps.eventResize.segs : null}

              // dimensions
              slotWidth={props.slotWidth}
            />
            <InnerContent // TODO: make fully filled
              tag="div"
              className='fc-timeline-lane-misc fc-flex-col fc-fill-top'
            />
            <div // TODO: track height
              className={joinArrayishClassNames(
                options.resourceLaneTopClassNames,
              )}
            />
            <TimelineFg
              dateProfile={props.dateProfile}
              tDateProfile={props.tDateProfile}
              nowDate={props.nowDate}
              todayRange={props.todayRange}

              // content
              fgEventSegs={slicedProps.fgEventSegs}
              eventDrag={slicedProps.eventDrag}
              eventResize={slicedProps.eventResize}
              eventSelection={slicedProps.eventSelection}
              resourceId={resource.id}

              // dimensions
              slotWidth={props.slotWidth}

              // ref
              heightRef={this.handleEventsHeight}
            />
            <div
              ref={this.handleFooterEl}
              className={generateClassName(options.resourceLaneBottomClassNames, {
                isCompact: !options.eventOverlap,
              })}
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  handleEventsHeight = (eventsHeight: number) => { // already executing "after size"
    this.eventsHeight = eventsHeight
    afterSize(this.handleHeight)
  }

  handleFooterEl = (footerEl: HTMLElement) => {
    if (this.disconnectFooterHeight) {
      this.disconnectFooterHeight()
      this.disconnectFooterHeight = undefined
    }
    if (footerEl) {
      this.disconnectFooterHeight = watchHeight(footerEl, (footerHeight) => {
        this.footerHeight = footerHeight
        afterSize(this.handleHeight)
      })
    }
  }

  handleHeight = () => {
    const { eventsHeight, footerHeight } = this

    if (eventsHeight != null && footerHeight != null) {
      setRef(this.props.heightRef, eventsHeight + footerHeight)
    }
  }
}
