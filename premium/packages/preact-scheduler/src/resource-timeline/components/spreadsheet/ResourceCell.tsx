import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  BaseComponent,
  memoizeObjArg,
  ContentContainer,
  ViewContext,
  watchHeight,
  setRef,
  generateClassName,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { type ReactNode, createRef, type Ref } from 'react'
import { ResourceApi } from '../../../resource/api/ResourceApi'
import { Resource } from '../../../resource/structs/resource'
import { ResourceIndent } from './ResourceIndent'
import { ResourceExpander } from './ResourceExpander'
import { ResourceCellData, ColSpec } from '../../structs'

export interface ResourceCellProps {
  colSpec: ColSpec
  resource: Resource
  field: string
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
      field: props.field,
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
          classNames.tight,
          classNames.flexCol,
          classNames.alignStart,
          props.borderStart ? classNames.borderOnlyS : classNames.borderNone,
          classNames.crop,
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
        classNameGenerator={colSpec.cellClass}
        didMount={colSpec.cellDidMount}
        willUnmount={colSpec.cellWillUnmount}
      >
        {(InnerContent) => (
          <div
            ref={this.innerElRef}
            className={joinClassNames(
              classNames.rigid,
              classNames.flexRow,
            )}
            style={{
              isolation: 'isolate', // TODO: className
            }}
          >
            {colSpec.isMain && Boolean(props.indent) && (
              <ResourceIndent
                level={props.indent}
                indentWidth={props.indentWidth}
                style={{ zIndex: 2 }}
              >
                {props.hasChildren && (
                  <ResourceExpander
                    isExpanded={props.isExpanded}
                    onExpanderClick={this.onExpanderClick}
                  />
                )}
              </ResourceIndent>
            )}
            <InnerContent
              tag='div'
              className={generateClassName(colSpec.cellInnerClass, renderProps)}
              style={{ zIndex: 1 }}
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

function renderResourceInner(renderProps: ResourceCellData): ReactNode {
  return renderProps.fieldValue || <>&nbsp;</>
}

// Render Props

interface RenderPropsInput {
  resource: Resource
  field: string
  fieldValue: any
  context: ViewContext
}

function refineRenderProps(input: RenderPropsInput): ResourceCellData {
  return {
    resource: new ResourceApi(input.context, input.resource),
    field: input.field,
    fieldValue: input.fieldValue,
    view: input.context.viewApi,
  }
}
