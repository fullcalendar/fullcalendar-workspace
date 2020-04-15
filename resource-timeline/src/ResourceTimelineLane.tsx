import { h, Ref, BaseComponent, CssDimValue, ComponentContext, setRef, buildHookClassNameGenerator, ContentHook, MountHook } from '@fullcalendar/core'
import { Resource, ResourceApi } from '@fullcalendar/resource-common'
import { TimelineLane, TimelineLaneCoreProps } from '@fullcalendar/timeline'


export interface ResourceTimelineLaneProps extends TimelineLaneCoreProps {
  elRef: Ref<HTMLTableRowElement>
  resource: Resource
  innerHeight: CssDimValue
  onHeightChange?: (rowEl: HTMLTableRowElement, isStable: boolean) => void
}


export class ResourceTimelineLane extends BaseComponent<ResourceTimelineLaneProps> {

  buildClassNames = buildHookClassNameGenerator('resourceLane')
  rootEl: HTMLTableRowElement


  render(props: ResourceTimelineLaneProps, state: {}, context: ComponentContext) {
    let hookPropOrigin = { resource: props.resource }
    let hookProps = { resource: new ResourceApi(context.calendar, props.resource) }
    let customClassNames = this.buildClassNames(hookProps, context, null, hookPropOrigin)

    return (
      <tr ref={this.handleRootEl}>
        <MountHook name='resourceLane' hookProps={hookProps}>
          {(rootElRef) => (
            <td ref={rootElRef} className={[ 'fc-timeline-lane', 'fc-resource' ].concat(customClassNames).join(' ')} data-resource-id={props.resource.id}>
              <div class='fc-timeline-lane-frame' style={{ height: props.innerHeight }}>
                <ResourceTimelineLaneMisc resource={props.resource} />
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
        </MountHook>
      </tr>
    ) // important NOT to do liquid-height. dont want to shrink height smaller than content
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


interface ResourceTimelineLaneMiscProps {
  resource: Resource
}

class ResourceTimelineLaneMisc extends BaseComponent<ResourceTimelineLaneMiscProps> {

  render(props: ResourceTimelineLaneMiscProps, state: {}, context: ComponentContext) {
    let hookProps = { resource: new ResourceApi(context.calendar, props.resource) }

    return (
      <ContentHook name='resourceLane' hookProps={hookProps}>
        {(innerElRef, innerContent) => (
          innerContent && // TODO: test how this would interfere with height
            <div class='fc-timeline-lane-misc' ref={innerElRef}>{innerContent}</div>
        )}
      </ContentHook>
    )
  }

}
