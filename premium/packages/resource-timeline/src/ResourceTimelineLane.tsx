import { CssDimValue } from '@fullcalendar/core'
import {
  BaseComponent,
  elementClosest, memoizeObjArg, ContentContainer,
} from '@fullcalendar/core/internal'
import { createElement, Ref } from '@fullcalendar/core/preact'
import { Resource, refineRenderProps } from '@fullcalendar/resource/internal'
import { TimelineLane, TimelineLaneCoreProps } from '@fullcalendar/timeline/internal'

export interface ResourceTimelineLaneProps extends TimelineLaneCoreProps {
  elRef: Ref<HTMLTableRowElement>
  resource: Resource
  innerHeight: CssDimValue
  onHeightChange?: (rowEl: HTMLTableRowElement, isStable: boolean) => void
}

export class ResourceTimelineLane extends BaseComponent<ResourceTimelineLaneProps> {
  refineRenderProps = memoizeObjArg(refineRenderProps) as (typeof refineRenderProps)

  render() {
    let { props, context } = this
    let { options } = context
    let renderProps = this.refineRenderProps({ resource: props.resource, context })

    return (
      <tr ref={props.elRef}>
        <ContentContainer
          elTag="td"
          elClasses={[
            'fc-timeline-lane',
            'fc-resource',
          ]}
          elAttrs={{
            'data-resource-id': props.resource.id,
          }}
          renderProps={renderProps}
          generatorName="resourceLaneContent"
          generator={options.resourceLaneContent}
          classNameGenerator={options.resourceLaneClassNames}
          didMount={options.resourceLaneDidMount}
          willUnmount={options.resourceLaneWillUnmount}
        >
          {(InnerContent) => (
            <div className="fc-timeline-lane-frame" style={{ height: props.innerHeight }}>
              <InnerContent
                elTag="div"
                elClasses={['fc-timeline-lane-misc']}
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
                timelineCoords={props.timelineCoords}
                onHeightChange={this.handleHeightChange}
                resourceId={props.resource.id}
              />
            </div>
          )}
        </ContentContainer>
      </tr>
    ) // important NOT to do liquid-height. dont want to shrink height smaller than content
  }

  handleHeightChange = (innerEl: HTMLElement, isStable: boolean) => {
    if (this.props.onHeightChange) {
      this.props.onHeightChange(
        // would want to use own <tr> ref, but not guaranteed to be ready when this fires
        elementClosest(innerEl, 'tr') as HTMLTableRowElement,
        isStable,
      )
    }
  }
}
