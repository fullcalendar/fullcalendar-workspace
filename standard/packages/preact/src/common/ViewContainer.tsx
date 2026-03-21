import { ViewSpec } from '../structs/view-spec'
import { MountData } from './render-hook'
import type { ReactNode } from 'react'
import { BaseComponent } from '../vdom-util'
import { ViewApi } from '../api/ViewApi'
import { ContentContainer } from '../content-inject/ContentContainer'
import { ElProps } from '../content-inject/ContentInjector'
import { joinClassNames } from '../util/html'
import { CssDimValue } from '../scrollgrid/util'
import { memoizeObjArg } from '../util/memoize'

export interface ViewContainerProps extends Partial<ElProps> {
  viewSpec: ViewSpec
  attrs?: any // TODO
  children?: ReactNode
  borderlessX: boolean
  borderlessTop: boolean
  borderlessBottom: boolean
}

export interface ViewDisplayData {
  view: ViewApi
  borderlessX: boolean
  borderlessTop: boolean
  borderlessBottom: boolean
  options: {
    height: CssDimValue | undefined,
    contentHeight: CssDimValue | undefined,
    headerToolbar: any,
    footerToolbar: any,
  }
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
        className={joinClassNames(
          props.className,
        )}
        style={props.style}
        renderProps={this.refineRenderProps({
          viewApi: context.viewApi,
          height: options.height,
          contentHeight: options.contentHeight,
          headerToolbar: options.headerToolbar,
          footerToolbar: options.footerToolbar,
          borderlessX: props.borderlessX,
          borderlessTop: props.borderlessTop,
          borderlessBottom: props.borderlessBottom,
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
  height: CssDimValue | undefined
  contentHeight: CssDimValue | undefined
  headerToolbar: any
  footerToolbar: any
  borderlessX: boolean
  borderlessTop: boolean
  borderlessBottom: boolean
}

function refineRenderProps(raw: ViewRenderPropsInput): ViewDisplayData {
  return {
    view: raw.viewApi,
    borderlessX: raw.borderlessX,
    borderlessTop: raw.borderlessTop,
    borderlessBottom: raw.borderlessBottom,
    options: {
      height: raw.height,
      contentHeight: raw.contentHeight,
      headerToolbar: raw.headerToolbar,
      footerToolbar: raw.footerToolbar,
    },
  }
}
