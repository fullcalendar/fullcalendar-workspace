import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  CustomContent, generateClassName, memoWithEquality, useRenderHookEl, useReportedSize, useStableCallback,
  useViewContext,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { type ReactNode, type Ref, createElement } from 'react'
import { Group, createGroupId, isGroupsEqual } from '../../../resource/common/resource-hierarchy'
import { ResourceIndent } from './ResourceIndent'
import { ResourceExpander } from './ResourceExpander'
import { ResourceGroupHeaderInfo, GroupSpec } from '../../structs'
import { type AriaCellInput, buildAriaCellAttrs } from '../../aria'

export interface ResourceGroupHeaderCellProps extends AriaCellInput {
  group: Group
  isExpanded: boolean // for expander icon (aria-expanded lives on the row)
  colSpan: number
  borderBottom: boolean
  indentWidth: number | undefined

  // refs
  innerHeightRef?: Ref<number>

  // position
  height?: number // does NOT include the border
  forPrint?: boolean
}

/*
Group cell that spans horizontally, consuming multiple colspans
*/
const INNER_STYLE = { isolation: 'isolate' } as const // TODO: className

export const ResourceGroupHeaderCell = memoWithEquality(function ResourceGroupHeaderCell(
  props: ResourceGroupHeaderCellProps,
) {
  let context = useViewContext()
  let { forPrint } = props
  let renderProps: ResourceGroupHeaderInfo = {
    fieldValue: props.group.value,
    view: context.viewApi,
  }
  let spec = props.group.spec as GroupSpec // type HACK
  let renderHookEl = useRenderHookEl({
    classGenerator: spec.labelClass,
    didMount: spec.labelDidMount,
    willUnmount: spec.labelWillUnmount,
    renderProps,
  })
  let innerElRef = useReportedSize({ watchHeight: true, heightRef: props.innerHeightRef })
  let onExpanderClick = useStableCallback(() => {
    context.dispatch({
      type: 'SET_RESOURCE_ENTITY_EXPANDED',
      id: createGroupId(props.group),
      isExpanded: !props.isExpanded,
    })
  })

  return createElement(
    forPrint ? 'td' : 'div',
    {
      ...(forPrint ? {
        colSpan: props.colSpan,
      } : {
        ...buildAriaCellAttrs(props),
        role: 'rowheader',
        'aria-colspan': props.colSpan,
      }),
      ref: renderHookEl.ref,
      className: joinClassNames(
        renderHookEl.className,
        !forPrint && classNames.liquid, // expand to whole row
        classNames.noMargin,
        classNames.noPadding,
        !forPrint && classNames.flexCol,
        classNames.alignStart, // h-align
        classNames.crop,
        classNames.contentBox,
        classNames.borderlessX,
        classNames.borderlessTop,
        !props.borderBottom && classNames.borderlessBottom,
      ),
      style: forPrint ? undefined : {
        height: props.height,
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
      <ResourceIndent
        level={1}
        indentWidth={props.indentWidth}
        className={classNames.z2}
      >
        <ResourceExpander
          isExpanded={props.isExpanded}
          onExpanderClick={onExpanderClick}
        />
      </ResourceIndent>
      <CustomContent
        tag="div"
        className={joinClassNames(
          generateClassName(spec.labelInnerClass, renderProps),
          classNames.z1,
        )}
        renderProps={renderProps}
        generatorName="resourceGroupHeaderContent"
        generator={spec.labelContent}
        fallback={renderCellInner}
      />
    </div>,
  )
}, {
  // also the spec, which holds the render hooks. unlike a class, a memo that skips a render keeps the
  // old props, which a later context-driven render would use
  group: (group0: Group, group1: Group) => isGroupsEqual(group0, group1) && group0.spec === group1.spec,
})

function renderCellInner(renderProps: ResourceGroupHeaderInfo): ReactNode {
  return renderProps.fieldValue || <>&nbsp;</>
}
