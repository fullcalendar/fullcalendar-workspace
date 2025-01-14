import { BaseComponent, memoizeObjArg, ContentContainer, watchHeight, setRef, afterSize, joinClassNames } from '@fullcalendar/core/internal'
import { createElement, Fragment, Ref } from '@fullcalendar/core/preact'
import { Resource, refineRenderProps } from '@fullcalendar/resource/internal'
import { TimelineLane, TimelineLaneProps } from '@fullcalendar/timeline/internal'

export interface ResourceLaneProps extends TimelineLaneProps {
  resource: Resource
  slotWidth: number | undefined

  // refs
  heightRef?: Ref<number>
}

export class ResourceLane extends BaseComponent<ResourceLaneProps> {
  private refineRenderProps = memoizeObjArg(refineRenderProps)
  private disconnectFooterHeight?: () => void
  private eventsHeight?: number
  private footerHeight?: number

  render() {
    let { props, context } = this
    let { options } = context
    let renderProps = this.refineRenderProps({ resource: props.resource, context })

    return (
      <ContentContainer
        tag="div"
        className={joinClassNames(
          'fc-resource',
          // very strange how this className is not on TimelineLane!!!
          'fc-timeline-lane',
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
            <InnerContent
              tag="div"
              className='fc-timeline-lane-misc'
            />
            <TimelineLane
              dateProfile={props.dateProfile}
              tDateProfile={props.tDateProfile}
              nowDate={props.nowDate}
              todayRange={props.todayRange}
              nextDayThreshold={props.nextDayThreshold}
              businessHours={props.businessHours}
              eventStore={props.eventStore}
              eventUiBases={props.eventUiBases}
              dateSelection={props.dateSelection}
              eventSelection={props.eventSelection}
              eventDrag={props.eventDrag}
              eventResize={props.eventResize}
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
