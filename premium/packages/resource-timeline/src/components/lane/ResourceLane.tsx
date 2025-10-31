import { BaseComponent, memoizeObjArg, ContentContainer, watchHeight, setRef, afterSize, joinClassNames, DateProfile, DateMarker, DateRange, EventStore, EventUiHash, DateSpan, EventInteractionState, generateClassName } from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement, Ref } from '@fullcalendar/core/preact'
import { Resource } from '@fullcalendar/resource/internal'
import { TimelineDateProfile, TimelineFg, TimelineBg, TimelineLaneSlicer } from '@fullcalendar/timeline/internal'
import { refineRenderProps } from '../../structs.js'

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
  insetInlineStart?: number

  // refs
  heightRef?: Ref<number>
}

export class ResourceLane extends BaseComponent<ResourceLaneProps> {
  // memo
  private refineRenderProps = memoizeObjArg(refineRenderProps)

  // internal
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
          props.className,
          classNames.flexRow,
          classNames.contentBox,
          props.borderBottom ? classNames.borderOnlyB : classNames.borderNone,
        )}
        style={{
          top: props.top,
          width: props.width,
          height: props.height,
          insetInlineStart: props.insetInlineStart,
        }}
        renderProps={renderProps}
        generatorName={undefined}
        classNameGenerator={options.resourceLaneClass}
        didMount={options.resourceLaneDidMount}
        willUnmount={options.resourceLaneWillUnmount}
      >
        {() => (
          <div
            role='gridcell'
            className={joinClassNames(
              classNames.liquid,
              classNames.flexCol,
              classNames.rel, // for fillTop
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
            <div
              ref={this.handleTopEl}
              className={generateClassName(options.resourceLaneTopClass, renderProps)}
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
              ref={this.handleBottomEl}
              className={generateClassName(options.resourceLaneBottomClass, renderProps)}
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

  handleTopEl = (topEl: HTMLElement) => {
    if (this.disconnectTopHeight) {
      this.disconnectTopHeight()
      this.disconnectTopHeight = undefined
    }
    if (topEl) {
      this.disconnectTopHeight = watchHeight(topEl, (topHeight) => {
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
        this.bottomHeight = bottomHeight
        afterSize(this.handleHeight)
      })
    }
  }

  handleHeight = () => {
    const { topHeight, bottomHeight, eventsHeight } = this

    if (topHeight != null && bottomHeight != null && eventsHeight != null) {
      setRef(this.props.heightRef, topHeight + bottomHeight + eventsHeight)
    }
  }
}
