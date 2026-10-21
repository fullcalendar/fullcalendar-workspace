import { createElement, memo, type Ref } from 'react'
import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  CustomContent, generateClassName, useRenderHookEl, useReportedSize, useViewContext,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { ColSpec } from '../../col-options'
import { ResourceColumnHeaderInfo } from '../../info-types'
import { ResourceIndent } from './ResourceIndent'
import { type AriaCellInput, buildAriaCellAttrs } from '../aria'

export interface HeaderCellProps extends AriaCellInput {
  colSpec: ColSpec
  resizer: boolean
  indent?: boolean
  borderStart: boolean

  // refs
  resizerElRef?: Ref<HTMLDivElement>
  innerHeightRef?: Ref<number>

  // size
  width: number | undefined
  indentWidth: number | undefined
  forPrint?: boolean
}

export const HeaderCell = memo(function HeaderCell(props: HeaderCellProps) {
  let context = useViewContext()
  let { colSpec, forPrint } = props
  let renderProps: ResourceColumnHeaderInfo = { view: context.viewApi }
  let renderHookEl = useRenderHookEl({
    classGenerator: colSpec.headerClass,
    didMount: colSpec.headerDidMount,
    willUnmount: colSpec.headerWillUnmount,
    renderProps,
  })
  let innerElRef = useReportedSize({ watchHeight: true, heightRef: props.innerHeightRef })

  // need empty inner div for abs positioning for resizer
  return createElement(
    forPrint ? 'th' : 'div',
    {
      ...buildAriaCellAttrs(props),
      role: 'columnheader',
      ref: renderHookEl.ref,
      className: joinClassNames(
        renderHookEl.className,
        forPrint && context.options.resourceHeaderRowClass,
        classNames.noMargin,
        classNames.noPadding,
        !forPrint && classNames.flexCol,
        classNames.borderlessY,
        classNames.borderlessEnd,
        !props.borderStart && classNames.borderlessStart,
        classNames.rel, // for resizer abs positioning
        // cannot crop because resizer is allowed to bleed out
      ),
      style: forPrint ? undefined : {
        minWidth: 0,
        width: props.width,
      },
    },
    <div
      className={joinClassNames(
        classNames.crop, // must crop instead of outer
        classNames.flexCol,
        classNames.alignStart,
      )}
    >
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
          className={generateClassName(colSpec.headerInnerClass, renderProps)}
          renderProps={renderProps}
          generatorName="resourceColumnHeaderContent"
          generator={colSpec.headerContent}
          fallback={colSpec.headerDefault}
        />
      </div>
    </div>,
    props.resizer && !forPrint && (
      <div
        ref={props.resizerElRef}
        className={joinClassNames(
          generateClassName(colSpec.headerResizerClass, renderProps),
          classNames.z1,
          classNames.cursorColResizer,
        )}
      />
    ),
  )
})
