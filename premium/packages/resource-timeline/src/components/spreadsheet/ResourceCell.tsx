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
import { ResourceApi } from '@fullcalendar/resource'
import { Resource } from '@fullcalendar/resource/internal'
import { ResourceIndent } from './ResourceIndent.js'
import { ResourceExpander } from './ResourceExpander.js'
import { ResourceCellContentArg, ColSpec } from '../../structs.js'

export interface ResourceCellProps {
  colSpec: ColSpec
  resource: Resource
  fieldValue: any
  indent: number
  hasChildren: boolean
  isExpanded: boolean
  innerHeightRef?: Ref<number>
  width: number | undefined
  indentWidth: number | undefined
  grow: number | undefined
  borderStart: boolean
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
        }}
        className={joinClassNames(
          'fcu-tight',
          props.borderStart ? 'fcu-border-only-s' : 'fcu-border-none',
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
              generateClassName(colSpec.cellInnerClassNames, renderProps),
              'fcu-rigid fcu-flex-row fcu-align-center',
            )}
          >
            {colSpec.isMain && (
              <ResourceIndent level={props.indent} indentWidth={props.indentWidth}>
                {props.hasChildren && (
                  <ResourceExpander
                    isExpanded={props.isExpanded}
                    onExpanderClick={this.onExpanderClick}
                  />
                )}
              </ResourceIndent>
            )}
            <InnerContent tag="div" />
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
