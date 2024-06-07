import { ViewApi } from '@fullcalendar/core'
import {
  BaseComponent,
  memoizeObjArg,
  ContentContainer,
  ViewContext,
} from '@fullcalendar/core/internal'
import { createElement, Fragment, ComponentChild, createRef } from '@fullcalendar/core/preact'
import { ResourceApi } from '@fullcalendar/resource'
import { Resource, ColSpec } from '@fullcalendar/resource/internal'
import { ExpanderIcon } from './ExpanderIcon.js'
import { RowSyncer } from './RowSyncer.js'
import { resourcePrefix } from './RowKey.js'

export interface SpreadsheetIndividualCellProps {
  colSpec: ColSpec
  resource: Resource
  fieldValue: any
  depth: number
  hasChildren: boolean
  isExpanded: boolean
  rowSyncer: RowSyncer
}

interface SpreadsheetIndividualCellState {
  frameHeight?: number
}

export class SpreadsheetIndividualCell extends BaseComponent<SpreadsheetIndividualCellProps, SpreadsheetIndividualCellState> {
  private refineRenderProps = memoizeObjArg(refineRenderProps)
  private innerElRef = createRef<HTMLDivElement>()

  render() {
    let { props, state, context } = this
    let { colSpec } = props
    let renderProps = this.refineRenderProps({
      resource: props.resource,
      fieldValue: props.fieldValue,
      context,
    })

    return (
      <ContentContainer
        elTag="td"
        elClasses={[
          'fc-datagrid-cell',
          'fc-resource',
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
          <div className="fc-datagrid-cell-frame" style={{ height: state.frameHeight }}>
            <div className="fc-datagrid-cell-cushion fc-scrollgrid-sync-inner" ref={this.innerElRef}>
              {colSpec.isMain && (
                <ExpanderIcon
                  depth={props.depth}
                  hasChildren={props.hasChildren}
                  isExpanded={props.isExpanded}
                  onExpanderClick={this.onExpanderClick}
                />
              )}
              <InnerContent
                elTag="span"
                elClasses={['fc-datagrid-cell-main']}
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

  // Report / Receive Cell Height
  // -----------------------------------------------------------------------------------------------

  componentDidMount(): void {
    this.props.rowSyncer.addHandler(this.props.resource.id, this.handleFrameHeight)
    this.context.addResizeHandler(this.handleResize)
    this.updateSize()
  }

  componentDidUpdate(): void {
    this.updateSize()
  }

  componentWillUnmount(): void {
    this.props.rowSyncer.removeHandler(this.props.resource.id, this.handleFrameHeight)
    this.context.removeResizeHandler(this.handleResize)
  }

  handleFrameHeight = (frameHeight: number) => {
    this.setState({ frameHeight })
  }

  handleResize = () => {
    this.updateSize()
  }

  updateSize() {
    const { props } = this
    props.rowSyncer.reportSize(
      resourcePrefix + props.resource.id,
      'col:' + (props.colSpec.field || ''),
      this.innerElRef.current.offsetHeight,
    )
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
