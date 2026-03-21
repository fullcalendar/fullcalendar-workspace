import { ViewSpec } from '../structs/view-spec'
import { MountData } from './render-hook'
import type { ReactNode } from 'react'
import { BaseComponent } from '../vdom-util'
import { ViewApi } from '../api/ViewApi'
import { ContentContainer } from '../content-inject/ContentContainer'
import { ElProps } from '../content-inject/ContentInjector'
import { joinClassNames } from '../util/html'
import { memoizeObjArg } from '../util/memoize'
import { computeViewBorderless } from '../util/misc'

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
    let { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)

    return (
      <ContentContainer
        elRef={props.elRef}
        tag={props.tag || 'div'}
        attrs={props.attrs}
        className={joinClassNames(
          props.className,
        )}
        style={props.style}
        renderProps={this.refineRenderProps({
          viewApi: context.viewApi,
          borderlessX,
          borderlessTop,
          borderlessBottom,
          isFirst: !options.headerToolbar,
          isLast: !options.footerToolbar,
          isHeightAuto: options.height === 'auto' || options.contentHeight === 'auto', // TODO: DRY
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
