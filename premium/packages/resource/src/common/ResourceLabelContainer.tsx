import { ViewApi } from '@fullcalendar/core'
import {
  ViewContextType, ViewContext,
  formatDayString, MountArg,
  ContentContainer,
  ElProps,
  InnerContainerFunc,
  memoizeObjArg,
  BaseComponent,
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { Resource } from '../structs/resource.js'
import { ResourceApi } from '../api/ResourceApi.js'

export interface ResourceLabelContainerProps extends ElProps {
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

export class ResourceLabelContainer extends BaseComponent<ResourceLabelContainerProps> {
  private refineRenderProps = memoizeObjArg(refineRenderProps)

  render() {
    const { props } = this

    return (
      <ViewContextType.Consumer>
        {(context: ViewContext) => {
          let { options } = context
          let renderProps = this.refineRenderProps({
            resource: props.resource,
            date: props.date,
            context,
          })

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
}

function renderInnerContent(props: ResourceLabelContentArg) {
  return props.resource.title || props.resource.id
}

// Render Props

interface ResourceLabelRenderPropsInput {
  resource: Resource
  date: Date
  context: ViewContext
}

function refineRenderProps(input: ResourceLabelRenderPropsInput): ResourceLabelContentArg {
  return {
    resource: new ResourceApi(input.context, input.resource),
    date: input.date ? input.context.dateEnv.toDate(input.date) : null,
    view: input.context.viewApi,
  }
}
