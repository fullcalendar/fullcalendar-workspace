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
import { ResourceCellInfo, ColSpec } from '../../structs'
import { type AriaCellInput, buildAriaCellAttrs } from '../../aria'

export interface ResourceCellProps extends AriaCellInput {
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
  borderStart: boolean
  borderBottom?: boolean
  forPrint?: boolean
}

export class ResourceCell extends BaseComponent<ResourceCellProps> {
  private innerElRef = createRef<HTMLDivElement>()
  private refineRenderProps = memoizeObjArg(refineRenderProps)
  private _isUnmounting: boolean
  private disconnectHeight?: () => void

  render() {
    let { props, context } = this
    let { colSpec, forPrint } = props

    let renderProps = this.refineRenderProps({
      resource: props.resource,
      field: props.field,
      fieldValue: props.fieldValue,
      context,
    })

    return (
      <ContentContainer
        tag={forPrint ? 'td' : 'div'}
        attrs={{
          ...buildAriaCellAttrs(props),
          role: colSpec.isMain ? 'rowheader' : 'gridcell',
          'data-resource-id': props.resource.id,
        }}
        className={joinClassNames(
          classNames.noMargin,
          classNames.noPadding,
          !forPrint && classNames.flexCol,
          classNames.alignStart,
          forPrint && context.options.resourceRowClass,
          classNames.borderlessTop,
          classNames.borderlessEnd,
          !props.borderStart && classNames.borderlessStart,
          !props.borderBottom && classNames.borderlessBottom,
          classNames.crop,
        )}
        style={forPrint ? undefined : {
          minWidth: 0,
          width: props.width,
        }}
        renderProps={renderProps}
        generatorName="resourceCellContent"
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
              classNames.noShrink,
              classNames.whiteSpaceNoWrap,
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
                className={classNames.z2}
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
              tag="div"
              className={joinClassNames(
                generateClassName(colSpec.cellInnerClass, renderProps),
                classNames.z1,
              )}
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    this._isUnmounting = false
    this.disconnectHeight = watchHeight(this.innerElRef.current, (height) => {
      if (this._isUnmounting) return
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
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

function renderResourceInner(renderProps: ResourceCellInfo): ReactNode {
  return renderProps.fieldValue || <>&nbsp;</>
}

// Render Props

interface RenderPropsInput {
  resource: Resource
  field: string
  fieldValue: any
  context: ViewContext
}

function refineRenderProps(input: RenderPropsInput): ResourceCellInfo {
  return {
    resource: new ResourceApi(input.context, input.resource),
    field: input.field,
    fieldValue: input.fieldValue,
    view: input.context.viewApi,
  }
}
