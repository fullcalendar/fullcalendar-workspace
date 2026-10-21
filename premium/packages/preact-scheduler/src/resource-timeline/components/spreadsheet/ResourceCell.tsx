import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  CustomContent,
  ViewContext,
  generateClassName,
  useRenderHookEl,
  useReportedSize,
  useStableCallback,
  useViewContext,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { type ReactNode, createElement, memo, useMemo, type Ref } from 'react'
import { ResourceApi } from '../../../resource/api/ResourceApi'
import { Resource } from '../../../resource/resource'
import { ResourceIndent } from './ResourceIndent'
import { ResourceExpander } from './ResourceExpander'
import { ResourceCellInfo } from '../../info-types'
import { ColSpec } from '../../col-options'
import { type AriaCellInput, buildAriaCellAttrs, getAriaCellRole } from '../aria'

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

const INNER_STYLE = { isolation: 'isolate' } as const // TODO: className

export const ResourceCell = memo(function ResourceCell(props: ResourceCellProps) {
  let context = useViewContext()
  let { colSpec, forPrint } = props

  let renderProps = useMemo(() => refineRenderProps({
    resource: props.resource,
    field: props.field,
    fieldValue: props.fieldValue,
    context,
  }), [props.resource, props.field, props.fieldValue, context])
  let renderHookEl = useRenderHookEl({
    classGenerator: colSpec.cellClass,
    didMount: colSpec.cellDidMount,
    willUnmount: colSpec.cellWillUnmount,
    renderProps,
  })
  let innerElRef = useReportedSize({ watchHeight: true, heightRef: props.innerHeightRef })

  let onExpanderClick = useStableCallback(() => {
    if (props.hasChildren) {
      context.dispatch({
        type: 'SET_RESOURCE_ENTITY_EXPANDED',
        id: props.resource.id,
        isExpanded: !props.isExpanded,
      })
    }
  })

  return createElement(
    forPrint ? 'td' : 'div',
    {
      ...buildAriaCellAttrs(props),
      role: colSpec.isMain ? 'rowheader' : getAriaCellRole(props),
      'data-resource-id': props.resource.id,
      ref: renderHookEl.ref,
      className: joinClassNames(
        renderHookEl.className,
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
      ),
      style: forPrint ? undefined : {
        minWidth: 0,
        width: props.width,
      },
    },
    <div
      ref={innerElRef}
      className={joinClassNames(
        classNames.noShrink,
        classNames.whiteSpaceNoWrap,
        classNames.flexRow,
      )}
      style={INNER_STYLE}
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
              onExpanderClick={onExpanderClick}
            />
          )}
        </ResourceIndent>
      )}
      <CustomContent
        tag="div"
        className={joinClassNames(
          generateClassName(colSpec.cellInnerClass, renderProps),
          classNames.z1,
        )}
        renderProps={renderProps}
        generatorName="resourceCellContent"
        generator={colSpec.cellContent}
        fallback={renderResourceInner}
      />
    </div>,
  )
})

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
