import { h, Ref, ComponentChildren, ComponentContextType, ComponentContext, RenderHook, ViewApi, formatDayString } from '@fullcalendar/core'
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

interface ResourceInnerProps {
  resource: ResourceApi
  date?: Date
  view: ViewApi
}


// TODO: not used for Spreadsheet. START USING. difficult because of col-specific rendering props


export function ResourceLabelRoot(props: ResourceLabelRootProps) {
  return (
    <ComponentContextType.Consumer>
      {(context: ComponentContext) => {
        let hookProps: ResourceInnerProps = {
          resource: new ResourceApi(context.calendar, props.resource),
          date: props.date ? context.dateEnv.toDate(props.date) : null,
          view: context.view
        }

        let dataAttrs = {
          'data-resource-id': props.resource.id, // TODO: only do public-facing one?
          'data-date': props.date ? formatDayString(props.date) : undefined
        }

        return (
          <RenderHook name='resourceLabel' hookProps={hookProps} defaultContent={renderInnerContent}>
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
    </ComponentContextType.Consumer>
  )
}


function renderInnerContent(props: ResourceInnerProps) {
  return props.resource.title || props.resource.id
}
