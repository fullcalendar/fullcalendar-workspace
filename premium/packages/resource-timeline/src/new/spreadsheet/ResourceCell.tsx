import { ViewApi } from '@fullcalendar/core'
import {
  BaseComponent,
  memoizeObjArg,
  ContentContainer,
  ViewContext,
} from '@fullcalendar/core/internal'
import { createElement, Fragment, ComponentChild } from '@fullcalendar/core/preact'
import { ResourceApi } from '@fullcalendar/resource'
import { Resource, ColSpec } from '@fullcalendar/resource/internal'
import { ExpanderIcon } from './ExpanderIcon.js'

export interface ResourceCellProps {
  colSpec: ColSpec
  resource: Resource
  fieldValue: any
  indent: number
  hasChildren: boolean
  isExpanded: boolean
  height?: number | undefined
}

export class ResourceCell extends BaseComponent<ResourceCellProps> {
  private refineRenderProps = memoizeObjArg(refineRenderProps)

  render() {
    let { props, context } = this
    let { colSpec } = props
    let renderProps = this.refineRenderProps({
      resource: props.resource,
      fieldValue: props.fieldValue,
      context,
    })

    return (
      <ContentContainer
        elTag="div"
        elClasses={[
          'fcnew-cell',
          'fcnew-resource',
        ]}
        elAttrs={{
          role: 'gridcell',
          'data-resource-id': props.resource.id,
        }}
        renderProps={renderProps}
        generatorName={colSpec.isMain ? 'resourceLabelContent' : undefined}
        customGenerator={colSpec.cellContent}
        defaultGenerator={renderResourceInner}
        classNameGenerator={colSpec.cellClassNames}
        didMount={colSpec.cellDidMount}
        willUnmount={colSpec.cellWillUnmount}
      >
        {(InnerContent) => (
          <div style={{ height: props.height }}>
            <div className="fcnew-datagrid-cell-cushion">
              {colSpec.isMain && (
                <ExpanderIcon
                  indent={props.indent}
                  hasChildren={props.hasChildren}
                  isExpanded={props.isExpanded}
                  onExpanderClick={this.onExpanderClick}
                />
              )}
              <InnerContent
                elTag="span"
                elClasses={['fcnew-datagrid-cell-main']}
              />
            </div>
          </div>
        )}
      </ContentContainer>
    )
  }

  onExpanderClick = (ev: UIEvent) => {
    let { props } = this

    if (props.hasChildren) {
      this.context.dispatch({
        type: 'SET_RESOURCE_ENTITY_EXPANDED',
        id: props.resource.id,
        isExpanded: !props.isExpanded,
      })
    }
  }
}

function renderResourceInner(renderProps: RenderProps): ComponentChild {
  return renderProps.fieldValue || <Fragment>&nbsp;</Fragment>
}

// Render Props

interface RenderPropsInput {
  resource: Resource
  fieldValue: any
  context: ViewContext
}

interface RenderProps {
  resource: ResourceApi
  fieldValue: any
  view: ViewApi
}

function refineRenderProps(input: RenderPropsInput): RenderProps {
  return {
    resource: new ResourceApi(input.context, input.resource),
    fieldValue: input.fieldValue,
    view: input.context.viewApi,
  }
}
