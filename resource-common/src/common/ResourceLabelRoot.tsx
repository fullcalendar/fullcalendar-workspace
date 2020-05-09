import { h, Ref, ComponentChildren, ViewContextType, ViewContext, RenderHook, ViewApi, formatDayString } from '@fullcalendar/common'
import { Resource } from '../structs/resource'
import { ResourceApi } from '../api/ResourceApi'


export interface ResourceLabelRootProps {
  resource: Resource
  date?: Date
  children: (
    rootElRef: Ref<HTMLElement>,
    classNames: string[],
    dataAttrs: object,
    innerElRef: Ref<HTMLElement>,
    innerContent: ComponentChildren
  ) => ComponentChildren
}

export interface ResourceLabelHookProps {
  resource: ResourceApi
  date?: Date
  view: ViewApi
}


// TODO: not used for Spreadsheet. START USING. difficult because of col-specific rendering props


export function ResourceLabelRoot(props: ResourceLabelRootProps) {
  return (
    <ViewContextType.Consumer>
      {(context: ViewContext) => {
        let { options } = context
        let hookProps: ResourceLabelHookProps = {
          resource: new ResourceApi(context, props.resource),
          date: props.date ? context.dateEnv.toDate(props.date) : null,
          view: context.viewApi
        }

        let dataAttrs = {
          'data-resource-id': props.resource.id, // TODO: only do public-facing one?
          'data-date': props.date ? formatDayString(props.date) : undefined
        }

        return (
          <RenderHook<ResourceLabelHookProps>
            hookProps={hookProps}
            classNames={options.resourceLabelClassNames}
            content={options.resourceLabelContent}
            defaultContent={renderInnerContent}
            didMount={options.resourceLabelDidMount}
            willUnmount={options.resourceLabelWillUnmount}
          >
            {(rootElRef, classNames, innerElRef, innerContent) => props.children(
              rootElRef,
              classNames, // TODO: pass in 'fc-resource' ?
              dataAttrs,
              innerElRef,
              innerContent
            )}
          </RenderHook>
        )
      }}
    </ViewContextType.Consumer>
  )
}


function renderInnerContent(props: ResourceLabelHookProps) {
  return props.resource.title || props.resource.id
}
