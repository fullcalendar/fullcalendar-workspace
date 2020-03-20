import { h, Ref, BaseComponent, CssDimValue, RenderHook, ComponentContext, setRef } from '@fullcalendar/core'
import { Resource, ResourceApi } from '@fullcalendar/resource-common'
import { TimelineLane, TimelineLaneCoreProps } from '@fullcalendar/timeline'


export interface ResourceTimelineLaneProps extends TimelineLaneCoreProps {
  elRef: Ref<HTMLTableRowElement>
  resource: Resource
  innerHeight: CssDimValue
  onHeightChange?: (rowEl: HTMLTableRowElement, isStable: boolean) => void
}


export default class ResourceTimelineLane extends BaseComponent<ResourceTimelineLaneProps> {

  rootEl: HTMLTableRowElement


  render(props: ResourceTimelineLaneProps, state: {}, context: ComponentContext) {
    let innerProps = {
      resource: new ResourceApi(context.calendar, props.resource)
    }

    return (
      <tr ref={this.handleRootEl}>
        <RenderHook name='resourceLane' mountProps={innerProps} dynamicProps={innerProps}>
          {(rootElRef, customClassNames, innerElRef, innerContent) => (
            <td ref={rootElRef} className={[ 'fc-timeline-resource' ].concat(customClassNames).join(' ')} data-resource-id={props.resource.id}>
              <div class='fc-timeline-resource-inner' style={{ height: props.innerHeight }}>
                {innerContent && // TODO: test
                  <div class='fc-timeline-resource-misc' ref={innerElRef}>{innerContent}</div>
                }
                <TimelineLane
                  dateProfile={props.dateProfile}
                  dateProfileGenerator={props.dateProfileGenerator}
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
                />
              </div>
            </td>
          )}
        </RenderHook>
      </tr>
    ) // important NOT to do vgrow. dont want to shrink height smaller than content
  }


  handleRootEl = (el: HTMLTableRowElement) => {
    this.rootEl = el

    if (this.props.elRef) {
      setRef(this.props.elRef, el)
    }
  }


  handleHeightChange = (isStable: boolean) => {
    if (this.props.onHeightChange) {
      this.props.onHeightChange(this.rootEl, isStable)
    }
  }

}
