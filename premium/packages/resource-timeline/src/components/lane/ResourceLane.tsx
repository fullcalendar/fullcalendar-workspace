import { BaseComponent, memoizeObjArg, ContentContainer, watchHeight, setRef } from '@fullcalendar/core/internal'
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
  private unwatchHeight?: () => void

  render() {
    let { props, context } = this
    let { options } = context
    let renderProps = this.refineRenderProps({ resource: props.resource, context })

    return (
      <ContentContainer
        tag="div"
        className='fc-timeline-lane fc-flex-col'
        attrs={{ role: 'gridcell' }}
        elRef={this.handleRootEl}
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
            />
          </Fragment>
        )}
      </ContentContainer>
    )
  }

  handleRootEl = (rootEl: HTMLElement) => {
    if (this.unwatchHeight) {
      this.unwatchHeight()
      this.unwatchHeight = undefined
    }
    if (rootEl) {
      this.unwatchHeight = watchHeight(rootEl, (height) => {
        setRef(this.props.heightRef, height)
      })
    }
  }
}
