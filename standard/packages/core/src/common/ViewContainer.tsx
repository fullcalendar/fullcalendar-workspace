import { ViewSpec } from '../structs/view-spec.js'
import { MountArg } from './render-hook.js'
import { ComponentChildren, createElement } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { ViewApi } from '../api/ViewApi.js'
import { ContentContainer } from '../content-inject/ContentContainer.js'
import { ElProps } from '../content-inject/ContentInjector.js'

export interface ViewContainerProps extends Partial<ElProps> {
  viewSpec: ViewSpec
  attrs?: any // TODO
  children: ComponentChildren
}

export type ViewMountArg = MountArg<ViewApi>

export class ViewContainer extends BaseComponent<ViewContainerProps> {
  render() {
    let { props, context } = this
    let { options } = context

    return (
      <ContentContainer
        {...props}
        tag={props.tag || 'div'}
        attrs={props.attrs}
        className={props.className}
        renderProps={context.viewApi}
        classNameGenerator={options.viewClassNames}
        generatorName={undefined}
        didMount={options.viewDidMount}
        willUnmount={options.viewWillUnmount}
      >
        {() => props.children}
      </ContentContainer>
    )
  }
}
