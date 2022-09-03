import { createElement, BaseComponent, ContentHook } from '@fullcalendar/common'
import { Resource, ResourceApi, ResourceLaneContentArg } from '@fullcalendar/resource-common'

export interface ResourceTimelineLaneMiscProps {
  resource: Resource
}

export class ResourceTimelineLaneMisc extends BaseComponent<ResourceTimelineLaneMiscProps> {
  render() {
    let { props, context } = this
    let hookProps: ResourceLaneContentArg = { resource: new ResourceApi(context, props.resource) } // just easier to make directly

    return (
      <ContentHook hookProps={hookProps} content={context.options.resourceLaneContent}>
        {(innerElRef, innerContent) => (
          innerContent && // TODO: test how this would interfere with height
            <div className="fc-timeline-lane-misc" ref={innerElRef}>{innerContent}</div>
        )}
      </ContentHook>
    )
  }
}
