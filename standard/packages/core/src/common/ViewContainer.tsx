import { ViewSpec } from '../structs/view-spec'
import { MountData } from './render-hook'
import type { ReactNode } from 'react'
import { BaseComponent } from '../vdom-util'
import { ViewApi } from '../api/ViewApi'
import { ContentContainer } from '../content-inject/ContentContainer'
import { ElProps } from '../content-inject/ContentInjector'
import { joinClassNames } from '../util/html'
import classNames from '../internal-classnames'

export interface ViewContainerProps extends Partial<ElProps> {
  viewSpec: ViewSpec
  attrs?: any // TODO
  children?: ReactNode
  borderlessX: boolean
  borderlessTop: boolean
  borderlessBottom: boolean
  noEdgeEffects: boolean
}

export interface ViewDisplayData {
  view: ViewApi
}

export type ViewMountData = MountData<ViewDisplayData>

export class ViewContainer extends BaseComponent<ViewContainerProps> {
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
          props.borderlessX && classNames.borderlessX,
          props.borderlessTop && classNames.borderlessTop,
          props.borderlessBottom && classNames.borderlessBottom,
          props.noEdgeEffects && classNames.noEdgeEffects,
        )}
        style={props.style}
        renderProps={{
          view: context.viewApi,
        }}
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
