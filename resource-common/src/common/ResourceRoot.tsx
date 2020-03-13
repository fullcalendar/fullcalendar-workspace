import { h, Ref, ComponentChildren, ComponentContextType, ComponentContext, RenderHook, ViewApi } from '@fullcalendar/core'
import { Resource } from '../structs/resource'
import ResourceApi from '../api/ResourceApi'


export interface ResourceRootProps {
  resource: Resource
  date?: Date
  children: (
    rootElRef: Ref<HTMLElement>,
    classNames: string[],
    innerElRef: Ref<HTMLElement>,
    innerContent: ComponentChildren
  ) => ComponentChildren
}

interface ResourceInnerProps {
  resource: ResourceApi
  date?: Date
  view: ViewApi
}


export default function ResourceRoot(props: ResourceRootProps) {
  return (
    <ComponentContextType.Consumer>
      {(context: ComponentContext) => {
        let innerProps: ResourceInnerProps = {
          resource: new ResourceApi(context.calendar, props.resource),
          date: props.date ? context.dateEnv.toDate(props.date) : null,
          view: context.view
        }

        return (
          <RenderHook name='resource' mountProps={innerProps} dynamicProps={innerProps} defaultInnerContent={renderInnerContent}>
            {props.children}
          </RenderHook>
        )
      }}
    </ComponentContextType.Consumer>
  )
}


function renderInnerContent(props: ResourceInnerProps) {
  return props.resource.title || props.resource.id
}
