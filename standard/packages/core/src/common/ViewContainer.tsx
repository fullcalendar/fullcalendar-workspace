import { ViewSpec } from '../structs/view-spec.js'
import { MountData } from './render-hook.js'
import { ComponentChildren, createElement } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { ViewApi } from '../api/ViewApi.js'
import { ContentContainer } from '../content-inject/ContentContainer.js'
import { ElProps } from '../content-inject/ContentInjector.js'
import { joinClassNames } from '../util/html.js'
import classNames from '../internal-classnames.js'

export interface ViewContainerProps extends Partial<ElProps> {
  viewSpec: ViewSpec
  attrs?: any // TODO
  children: ComponentChildren
  borderlessX: boolean
  borderlessTop: boolean
  borderlessBottom: boolean
  noEdgeEffects: boolean
}

export interface ViewData {
  view: ViewApi
}

export type ViewMountData = MountData<ViewData>

export class ViewContainer extends BaseComponent<ViewContainerProps> {
  render() {
    let { props, context } = this
    let { options } = context

    return (
      <ContentContainer
        {...props}
        tag={props.tag || 'div'}
        attrs={props.attrs}
        className={joinClassNames(
          props.className,
          props.borderlessX && classNames.borderlessX,
          props.borderlessTop && classNames.borderlessTop,
          props.borderlessBottom && classNames.borderlessBottom,
          props.noEdgeEffects && classNames.noEdgeEffects,
        )}
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
