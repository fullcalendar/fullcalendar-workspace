import { ViewSpec } from '../structs/view-spec'
import { MountData } from './render-hook'
import type { ReactNode } from 'react'
import { BaseComponent } from '../vdom-util'
import { ViewApi } from '../api/ViewApi'
import { ContentContainer } from '../content-inject/ContentContainer'
import { ElProps } from '../content-inject/ContentInjector'
import { memoizeObjArg } from '../util/memoize'
import { computeViewBorderless } from '../util/misc'
import { getIsHeightAuto } from '../scrollgrid/util'

export interface ViewContainerProps extends Partial<ElProps> {
  viewSpec: ViewSpec
  attrs?: any // TODO
  children?: ReactNode
}

export interface ViewDisplayData {
  view: ViewApi
  borderlessX: boolean
  borderlessTop: boolean
  borderlessBottom: boolean
  isFirst: boolean
  isLast: boolean
  isHeightAuto: boolean
}

export type ViewMountData = MountData<ViewDisplayData>

export class ViewContainer extends BaseComponent<ViewContainerProps> {
  private refineRenderProps = memoizeObjArg(refineRenderProps)

  render() {
    let { props, context } = this
    let { options } = context

    return (
      <ContentContainer
        elRef={props.elRef}
        tag={props.tag || 'div'}
        attrs={props.attrs}
        className={props.className}
        style={props.style}
        renderProps={this.refineRenderProps({
          ...computeViewBorderless(options),
          isFirst: !options.headerToolbar,
          isLast: !options.footerToolbar,
          isHeightAuto: getIsHeightAuto(options),
          viewApi: context.viewApi,
        })}
        classNameGenerator={options.viewClass}
        generatorName={undefined}
        didMount={options.viewDidMount}
        willUnmount={options.viewWillUnmount}
      >
        {() => props.children}
      </ContentContainer>
    )
  }
}

interface ViewRenderPropsInput {
  viewApi: ViewApi
  borderlessX: boolean
  borderlessTop: boolean
  borderlessBottom: boolean
  isFirst: boolean
  isLast: boolean
  isHeightAuto: boolean
}

function refineRenderProps(raw: ViewRenderPropsInput): ViewDisplayData {
  return {
    view: raw.viewApi,
    borderlessX: raw.borderlessX,
    borderlessTop: raw.borderlessTop,
    borderlessBottom: raw.borderlessBottom,
    isFirst: raw.isFirst,
    isLast: raw.isLast,
    isHeightAuto: raw.isHeightAuto,
  }
}
