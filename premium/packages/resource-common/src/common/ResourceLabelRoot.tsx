import {
  ViewContextType, ViewContext,
  ViewApi, formatDayString, MountArg,
  ContentContainer,
  ElProps,
  InnerContainerFunc,
} from '@fullcalendar/core'
import { createElement } from '@fullcalendar/core/preact'
import { Resource } from '../structs/resource.js'
import { ResourceApi } from '../api/ResourceApi.js'

export interface ResourceLabelRootProps extends ElProps {
  resource: Resource
  date?: Date
  children?: InnerContainerFunc<ResourceLabelContentArg>
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
        let renderProps: ResourceLabelContentArg = {
          resource: new ResourceApi(context, props.resource),
          date: props.date ? context.dateEnv.toDate(props.date) : null,
          view: context.viewApi,
        }

        return (
          <ContentContainer
            {...props}
            elAttrs={{
              ...props.elAttrs,
              'data-resource-id': props.resource.id, // TODO: only do public-facing one?
              'data-date': props.date ? formatDayString(props.date) : undefined,
            }}
            renderProps={renderProps}
            generatorName="resourceLabelContent"
            generator={options.resourceLabelContent || renderInnerContent}
            classNameGenerator={options.resourceLabelClassNames}
            didMount={options.resourceLabelDidMount}
            willUnmount={options.resourceLabelWillUnmount}
          />
        )
      }}
    </ViewContextType.Consumer>
  )
}

function renderInnerContent(props: ResourceLabelContentArg) {
  return props.resource.title || props.resource.id
}
