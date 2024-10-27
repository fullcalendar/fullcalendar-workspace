import { ViewApi } from '@fullcalendar/core'
import {
  BaseComponent,
  memoizeObjArg,
  ContentContainer,
  ViewContext,
  watchHeight,
  setRef,
  joinClassNames,
} from '@fullcalendar/core/internal'
import { createElement, Fragment, ComponentChild, createRef, Ref } from '@fullcalendar/core/preact'
import { ResourceApi } from '@fullcalendar/resource'
import { Resource, ColSpec } from '@fullcalendar/resource/internal'
import { ExpanderIcon } from './ExpanderIcon.js'

export interface ResourceCellProps {
  colIndex: number
  colSpec: ColSpec
  resource: Resource
  fieldValue: any
  indent: number
  hasChildren: boolean
  isExpanded: boolean
  innerHeightRef?: Ref<number>
  width?: number
}

export class ResourceCell extends BaseComponent<ResourceCellProps> {
  private innerElRef = createRef<HTMLDivElement>()
  private refineRenderProps = memoizeObjArg(refineRenderProps)
  private unwatchHeight?: () => void

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
        tag="div"
        attrs={{
          role: 'gridcell',
          'aria-colindex': props.colIndex,
          'data-resource-id': props.resource.id,
        }}
        className={joinClassNames(
          'fc-resource fc-cell',
          props.colIndex && 'fc-cell-border',
        )}
        style={{
          width: props.width,
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
          <div ref={this.innerElRef} className="fc-cell-inner fc-padding-lg fc-flex-row fc-align-center">
            {colSpec.isMain && (
              <ExpanderIcon
                indent={props.indent}
                hasChildren={props.hasChildren}
                isExpanded={props.isExpanded}
                onExpanderClick={this.onExpanderClick}
              />
            )}
            <InnerContent
              tag="span"
              className='fc-cell-main'
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    this.unwatchHeight = watchHeight(this.innerElRef.current, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.unwatchHeight()
    setRef(this.props.innerHeightRef, null)
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
