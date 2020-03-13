import { MountHook, h, Ref, ClassNamesHook, ComponentChildren, InnerContentHook, setRef, ViewApi, ComponentContextType, ComponentContext } from '@fullcalendar/core'
import { Resource } from '../structs/resource'
import ResourceApi from '../api/ResourceApi'


export interface ResourceLabelHookProps {
  resource: Resource
  date?: Date
  children: (rootElRef: Ref<HTMLElement>, classNames: string[], innerContent) => ComponentChildren
}

export interface ResourceLabelInnerProps {
  resource: ResourceApi
  view: ViewApi
}


// TODO: remove ClassNamesHook!


export default function ResourceLabelHook(props: ResourceLabelHookProps) {
  return (
    <ComponentContextType.Consumer>
      {(context: ComponentContext) => {
        let innerProps: ResourceLabelInnerProps = {
          resource: new ResourceApi(context.calendar, props.resource),
          view: context.view
        }

        return (
          <MountHook name='resourceLabel' handlerProps={innerProps}>
            {(rootElRef: Ref<HTMLElement>) => (
              <ClassNamesHook name='resourceLabel' handlerProps={innerProps}>
                {(classNames: string[]) => (
                  <InnerContentHook name='resourceLabel' innerProps={innerProps} defaultInnerContent={renderResourceInnerContent}>
                    {(innerContentParentRef: Ref<HTMLElement>, innerContent: ComponentChildren) => (
                      props.children(
                        (el: HTMLElement | null) => {
                          setRef(rootElRef, el)
                          setRef(innerContentParentRef, el)
                        },
                        classNames,
                        innerContent
                      )
                    )}
                  </InnerContentHook>
                )}
              </ClassNamesHook>
            )}
          </MountHook>
        )
      }}
    </ComponentContextType.Consumer>
  )
}


function renderResourceInnerContent(props: ResourceLabelInnerProps) {
  return props.resource.title || props.resource.id
}
