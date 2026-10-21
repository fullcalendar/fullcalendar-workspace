import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  CustomContent, generateClassName, useRenderHookEl, useReportedSize, useViewContext,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { type ReactNode, createElement, memo, type Ref } from 'react'
import { ColSpec } from '../../col-options'
import { ResourceGroupHeaderInfo } from '../../info-types'
import { type AriaCellInput, buildAriaCellAttrs } from '../aria'

export interface ResourceGroupCellProps extends AriaCellInput {
  colSpec: ColSpec
  fieldValue: any
  rowSpan?: number
  borderStart: boolean
  borderBottom?: boolean
  innerHeightRef?: Ref<number>
  forPrint?: boolean
}

/*
Cell for a resource group that can span multiple logical rows.
*/
export const ResourceGroupCell = memo(function ResourceGroupCell(props: ResourceGroupCellProps) {
  const context = useViewContext()
  const { colSpec, forPrint } = props
  const renderProps: ResourceGroupHeaderInfo = {
    fieldValue: props.fieldValue,
    view: context.viewApi,
  }
  const renderHookEl = useRenderHookEl({
    classGenerator: colSpec.cellClass,
    didMount: colSpec.cellDidMount,
    willUnmount: colSpec.cellWillUnmount,
    renderProps,
  })
  const innerElRef = useReportedSize({ watchHeight: true, heightRef: props.innerHeightRef })

  return createElement(
    forPrint ? 'td' : 'div',
    {
      ...(forPrint ? {
        rowSpan: props.rowSpan,
      } : {
        ...buildAriaCellAttrs(props),
        role: 'rowheader',
        'aria-rowspan': props.rowSpan,
      }),
      ref: renderHookEl.ref,
      className: joinClassNames(
        renderHookEl.className,
        classNames.noMargin,
        classNames.noPadding,
        !forPrint && classNames.flexCol,
        classNames.alignStart,
        !forPrint && classNames.liquid,
        forPrint && classNames.crop,
        forPrint && context.options.resourceRowClass,
        classNames.borderlessTop,
        classNames.borderlessEnd,
        !props.borderStart && classNames.borderlessStart,
        !props.borderBottom && classNames.borderlessBottom,
      ),
    },
    <div
      ref={innerElRef}
      className={joinClassNames(
        classNames.noShrink,
        classNames.whiteSpaceNoWrap,
        classNames.flexRow,
        !forPrint && classNames.stickyT,
      )}
    >
      <CustomContent
        tag="div"
        className={generateClassName(colSpec.cellInnerClass, renderProps)}
        renderProps={renderProps}
        generatorName="resourceCellContent"
        generator={colSpec.cellContent}
        fallback={renderGroupInner}
      />
    </div>,
  )
})

function renderGroupInner(renderProps: ResourceGroupHeaderInfo): ReactNode {
  return renderProps.fieldValue || <>&nbsp;</>
}
