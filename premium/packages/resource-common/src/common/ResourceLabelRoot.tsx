import {
  createElement, Ref, ComponentChildren, ViewContextType, ViewContext, RenderHook,
  ViewApi, formatDayString, Dictionary, MountArg,
} from '@fullcalendar/common'
import { Resource } from '../structs/resource'
import { ResourceApi } from '../api/ResourceApi'

export interface ResourceLabelRootProps {
  resource: Resource
  date?: Date
  children: (
    rootElRef: Ref<HTMLElement>,
    classNames: string[],
    dataAttrs: Dictionary,
    innerElRef: Ref<HTMLElement>,
    innerContent: ComponentChildren
  ) => ComponentChildren
}

export interface ResourceLabelContentArg {
  resource: ResourceApi
  date?: Date
  view: ViewApi
}

export type ResourceLabelMountArg = MountArg<ResourceLabelContentArg>

// TODO: not used for Spreadsheet. START USING. difficult because of col-specific rendering props

export function ResourceLabelRoot(props: ResourceLabelRootProps) {
  return (
    <ViewContextType.Consumer>
      {(context: ViewContext) => {
        let { options } = context
        let hookProps: ResourceLabelContentArg = {
          resource: new ResourceApi(context, props.resource),
          date: props.date ? context.dateEnv.toDate(props.date) : null,
          view: context.viewApi,
        }

        let dataAttrs = {
          'data-resource-id': props.resource.id, // TODO: only do public-facing one?
          'data-date': props.date ? formatDayString(props.date) : undefined,
        }

        return (
          <RenderHook<ResourceLabelContentArg>
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
              innerContent,
            )}
          </RenderHook>
        )
      }}
    </ViewContextType.Consumer>
  )
}

function renderInnerContent(props: ResourceLabelContentArg) {
  return props.resource.title || props.resource.id
}
