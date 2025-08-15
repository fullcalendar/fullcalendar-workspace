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
    let renderProps = this.refineRenderProps({
      resource,
      context,
      isCompact: !options.eventOverlap
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
          left: props.left,
          right: props.right,
          width: props.width,
          height: props.height,
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
            <div // TODO: track height
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
              ref={this.handleFooterEl}
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
