import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  CustomContent, generateClassName, useRenderHookEl, useReportedSize, useViewContext,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { createElement, memo, type Ref } from 'react'
import { Group } from '../../../resource/resource-hierarchy'
import { GroupSpec } from '../../col-options'
import { ResourceGroupLaneInfo } from '../../info-types'
import { type AriaCellInput, buildAriaCellAttrs, getAriaCellRole } from '../aria'

export interface GroupLaneProps extends AriaCellInput {
  group: Group

  borderBottom: boolean

  // refs
  innerHeightRef?: Ref<number>

  // positioning
  height?: number // does NOT include the border
  forPrint?: boolean
}

/*
parallels the ResourceGroupHeaderCell
*/
export const GroupLane = memo(function GroupLane(props: GroupLaneProps) {
  let context = useViewContext()
  let { group, forPrint } = props
  let groupSpec = group.spec as GroupSpec // type HACK
  let renderProps: ResourceGroupLaneInfo = {
    fieldValue: group.value,
    view: context.viewApi,
  }
  let renderHookEl = useRenderHookEl({
    classGenerator: groupSpec.laneClass,
    didMount: groupSpec.laneDidMount,
    willUnmount: groupSpec.laneWillUnmount,
    renderProps,
  })
  let innerElRef = useReportedSize({ watchHeight: true, heightRef: props.innerHeightRef })

  return createElement(
    forPrint ? 'td' : 'div',
    {
      ...buildAriaCellAttrs(props),
      role: getAriaCellRole(props),
      ref: renderHookEl.ref,
      className: joinClassNames(
        renderHookEl.className,
        !forPrint && classNames.liquid, // expand to whole row
        classNames.noMargin,
        classNames.noPadding,
        !forPrint && classNames.flexCol,
        classNames.contentBox,
        classNames.borderlessX,
        classNames.borderlessTop,
        !props.borderBottom && classNames.borderlessBottom,
      ),
      style: forPrint ? undefined : {
        height: props.height,
      },
    },
    <CustomContent
      tag="div"
      elRef={innerElRef}
      className={joinClassNames(
        generateClassName(groupSpec.laneInnerClass, renderProps),
        classNames.noShrink,
        classNames.noMargin,
      )}
      renderProps={renderProps}
      generatorName="resourceGroupLaneContent"
      generator={groupSpec.laneContent}
    />,
  )
})
