import { ViewSpec } from './view-spec'
import { createElement, memo, type ReactNode } from 'react'
import { ViewApi } from '../api/ViewApi'
import { generateClassName } from '../render-hook/render-hook-types'
import { ElProps } from '../render-hook/el-props'
import { useViewContext } from '../context/useViewContext'
import { useRenderHookEl } from '../render-hook/useRenderHookEl'
import { computeViewBorderless } from '../util/misc'
import { getIsHeightAuto } from '../scrollgrid/util'
import type { ToolbarInput } from '../toolbar/toolbar-types'
import { joinClassNames } from '../public-api'

export interface ViewContainerProps extends Partial<ElProps> {
  viewSpec: ViewSpec
  attrs?: any // TODO
  children?: ReactNode
}

export interface ViewDisplayInfo {
  view: ViewApi
  borderlessX: boolean
  borderlessTop: boolean
  borderlessBottom: boolean
  options: {
    headerToolbar: ToolbarInput | false | undefined
    footerToolbar: ToolbarInput | false | undefined
  }
  isHeightAuto: boolean
}

export const ViewContainer = memo(function ViewContainer(props: ViewContainerProps) {
  const context = useViewContext()
  const { options, viewSpec } = context
  const renderProps: ViewDisplayInfo = refineRenderProps({
    ...computeViewBorderless(options),
    options: { headerToolbar: options.headerToolbar, footerToolbar: options.footerToolbar },
    isHeightAuto: getIsHeightAuto(options),
    viewApi: context.viewApi,
  })
  const renderHookEl = useRenderHookEl({
    classGenerator: undefined,
    didMount: options.didMount || (options as any).viewDidMount, // TODO: should call both
    willUnmount: options.willUnmount || (options as any).viewWillUnmount, // TODO: should call both
    renderProps,
    elRef: props.elRef,
  })
  const className = joinClassNames(
    props.className,
    generateClassName((options as any).viewClass, renderProps),
    // WORKAROUND for way calendar's className would get merged into view's className
    generateClassName(viewSpec.optionDefaults.class, renderProps),
    generateClassName(viewSpec.optionDefaults.className, renderProps),
    generateClassName(viewSpec.optionOverrides.class, renderProps),
    generateClassName(viewSpec.optionOverrides.className, renderProps),
    props.attrs?.className,
  )

  return createElement(
    props.tag || 'div',
    {
      ...props.attrs,
      ref: renderHookEl.ref,
      className: className || undefined,
      style: props.style,
    },
    props.children,
  )
})

interface ViewRenderPropsInput {
  viewApi: ViewApi
  borderlessX: boolean
  borderlessTop: boolean
  borderlessBottom: boolean
  options: {
    headerToolbar: ToolbarInput | false | undefined
    footerToolbar: ToolbarInput | false | undefined
  }
  isHeightAuto: boolean
}

function refineRenderProps(raw: ViewRenderPropsInput): ViewDisplayInfo {
  return {
    view: raw.viewApi,
    borderlessX: raw.borderlessX,
    borderlessTop: raw.borderlessTop,
    borderlessBottom: raw.borderlessBottom,
    options: raw.options,
    isHeightAuto: raw.isHeightAuto,
  }
}
