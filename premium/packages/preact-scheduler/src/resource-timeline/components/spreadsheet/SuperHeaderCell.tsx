import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  CustomContent, generateClassName, useRenderHookEl, useReportedSize, useViewContext,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { createElement, memo, type Ref } from 'react'
import { ResourceColumnHeaderInfo } from '../../info-types'
import { ColHeaderRenderHooks } from '../../col-options'
import { ResourceIndent } from './ResourceIndent'
import { type AriaCellInput, buildAriaCellAttrs } from '../aria'

export interface SuperHeaderCellProps extends AriaCellInput {
  renderHooks: ColHeaderRenderHooks
  indent?: boolean
  indentWidth: number | undefined
  colSpan: number
  forPrint?: boolean

  // refs
  innerHeightRef?: Ref<number>
}

/*
TODO: make more DRY with HeaderCell. Almost exactly the same except doesn't need resizer
*/
export const SuperHeaderCell = memo(function SuperHeaderCell(props: SuperHeaderCellProps) {
  let context = useViewContext()
  let { renderHooks, forPrint } = props
  let renderProps: ResourceColumnHeaderInfo = { view: context.viewApi }
  const { options } = context
  const renderHookEl = useRenderHookEl({
    classGenerator: renderHooks.headerClass,
    didMount: renderHooks.headerDidMount,
    willUnmount: renderHooks.headerWillUnmount,
    renderProps,
  })
  const innerElRef = useReportedSize({ watchHeight: true, heightRef: props.innerHeightRef })

  return createElement(
    forPrint ? 'th' : 'div',
    {
      ...buildAriaCellAttrs(props),
      role: 'columnheader',
      'aria-colspan': props.colSpan,
      colSpan: forPrint ? props.colSpan : undefined,
      ref: renderHookEl.ref,
      className: joinClassNames(
        renderHookEl.className,
        forPrint && options.resourceHeaderRowClass,
        !forPrint && classNames.liquid,
        classNames.noMargin,
        classNames.noPadding,
        !forPrint && classNames.flexCol,
        classNames.alignStart,
        classNames.borderlessX,
        classNames.borderlessTop,
        !forPrint && classNames.borderlessBottom,
        !forPrint && classNames.crop,
      ),
    },
    <div
      ref={innerElRef}
      className={joinClassNames(
        classNames.noShrink,
        classNames.whiteSpaceNoWrap,
        classNames.flexRow,
      )}
    >
      {props.indent && (
        <ResourceIndent
          level={1}
          indentWidth={props.indentWidth}
        />
      )}
      <CustomContent
        tag="div"
        className={generateClassName(renderHooks.headerInnerClass, renderProps)}
        renderProps={renderProps}
        generatorName="resourceColumnHeaderContent"
        generator={renderHooks.headerContent}
        fallback={renderHooks.headerDefault}
      />
    </div>,
  )
})
