import {
  BaseComponent,
  memoizeObjArg,
  ContentContainer,
  ViewContext,
  watchHeight,
  setRef,
  joinClassNames,
  generateClassName,
} from '@fullcalendar/core/internal'
import { createElement, Fragment, ComponentChild, createRef, Ref } from '@fullcalendar/core/preact'
import { ResourceApi, ResourceCellContentArg } from '@fullcalendar/resource'
import { Resource, ColSpec } from '@fullcalendar/resource/internal'
import { ExpanderIcon } from './ExpanderIcon.js'

export interface ResourceCellProps {
  colSpec: ColSpec
  resource: Resource
  fieldValue: any
  indent: number
  hasChildren: boolean
  isExpanded: boolean
  innerHeightRef?: Ref<number>
  width: number | undefined
  grow: number | undefined
  className?: string
}

export class ResourceCell extends BaseComponent<ResourceCellProps> {
  private innerElRef = createRef<HTMLDivElement>()
  private refineRenderProps = memoizeObjArg(refineRenderProps)
  private disconnectHeight?: () => void

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
          role: colSpec.isMain ? 'rowheader' : 'gridcell',
          'aria-expanded': (colSpec.isMain && props.hasChildren) ? props.isExpanded : undefined,
          'data-resource-id': props.resource.id,
        }}
        className={joinClassNames(
          'fc-resource fc-cell',
          'fc-cell-bordered', // TODO: temporary
          props.className,
        )}
        style={{
          minWidth: 0,
          width: props.width,
          flexGrow: props.grow,
        }}
        renderProps={renderProps}
        generatorName='resourceCellContent'
        customGenerator={colSpec.cellContent}
        defaultGenerator={renderResourceInner}
        classNameGenerator={colSpec.cellClassNames}
        didMount={colSpec.cellDidMount}
        willUnmount={colSpec.cellWillUnmount}
      >
        {(InnerContent) => (
          <div
            ref={this.innerElRef}
            className={joinClassNames(
              "fc-cell-inner fc-padding-lg fc-flex-row fc-align-center",
              generateClassName(colSpec.cellInnerClassNames, renderProps),
            )}
          >
            {colSpec.isMain && (
              <ExpanderIcon
                indent={props.indent}
                hasChildren={props.hasChildren}
                isExpanded={props.isExpanded}
                onExpanderClick={this.onExpanderClick}
              />
            )}
            <InnerContent
              tag="div"
              className='fc-cell-main'
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    this.disconnectHeight = watchHeight(this.innerElRef.current, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.disconnectHeight()
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

function renderResourceInner(renderProps: ResourceCellContentArg): ComponentChild {
  return renderProps.fieldValue || <Fragment>&nbsp;</Fragment>
}

// Render Props

interface RenderPropsInput {
  resource: Resource
  fieldValue: any
  context: ViewContext
}

function refineRenderProps(input: RenderPropsInput): ResourceCellContentArg {
  return {
    resource: new ResourceApi(input.context, input.resource),
    fieldValue: input.fieldValue,
    view: input.context.viewApi,
  }
}
