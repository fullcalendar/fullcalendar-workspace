import { BaseComponent, memoizeObjArg, ContentContainer, watchHeight, setRef, afterSize, joinClassNames, DateProfile, DateMarker, DateRange, EventStore, EventUiHash, DateSpan, EventInteractionState } from '@fullcalendar/core/internal'
import { createElement, Fragment, Ref } from '@fullcalendar/core/preact'
import { Resource, refineRenderProps } from '@fullcalendar/resource/internal'
import { TimelineDateProfile, TimelineFg, TimelineBg, TimelineLaneSlicer } from '@fullcalendar/timeline/internal'

export interface ResourceLaneProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange

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
  slotWidth: number | undefined

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
    let { options } = context
    let renderProps = this.refineRenderProps({ resource: props.resource, context })

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
        className={joinClassNames(
          'fc-resource',
          'fc-timeline-lane', // okay???
          options.eventOverlap === false // TODO: fix bad default
            ? 'fc-timeline-overlap-disabled'
            : 'fc-timeline-overlap-enabled',
          'fc-flex-col',
        )}
        attrs={{
          role: 'gridcell',
        }}
        renderProps={renderProps}
        generatorName="resourceLaneContent"
        customGenerator={options.resourceLaneContent}
        classNameGenerator={options.resourceLaneClassNames}
        didMount={options.resourceLaneDidMount}
        willUnmount={options.resourceLaneWillUnmount}
      >
        {(InnerContent) => (
          <Fragment>
            <TimelineBg
              tDateProfile={props.tDateProfile}
              nowDate={props.nowDate}
              todayRange={props.todayRange}

              // content
              bgEventSegs={slicedProps.bgEventSegs}
              businessHourSegs={slicedProps.businessHourSegs}
              dateSelectionSegs={slicedProps.dateSelectionSegs}
              eventResizeSegs={slicedProps.eventResize ? slicedProps.eventResize.segs : [] /* bad new empty array? */}

              // dimensions
              slotWidth={props.slotWidth}
            />
            <InnerContent
              tag="div"
              className='fc-timeline-lane-misc fc-fill-top'
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
              resourceId={props.resource.id}

              // dimensions
              slotWidth={props.slotWidth}

              // ref
              heightRef={this.handleEventsHeight}
            />
            <div
              ref={this.handleFooterEl}
              className='fc-timeline-lane-footer'
            />
          </Fragment>
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
