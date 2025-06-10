import { ViewProps } from '../component-util/View.js'
import { mapHash } from '../util/object.js'
import { ComponentType, Component, createElement } from '../preact.js'
import { MountData } from '../common/render-hook.js'
import { ViewContext, ViewContextType } from '../ViewContext.js'
import { ViewOptions } from '../options.js'
import { Duration } from '../datelib/duration.js'
import { ContentContainer, generateClassName } from '../content-inject/ContentContainer.js'
import { BaseComponent } from '../vdom-util.js'

/*
A view-config represents information for either:
A) creating a new instantiatable view class. in which case, supplied a class/type in addition to options, OR
B) options to customize an existing view, in which case only provides options.
*/

export type ViewComponent = Component<ViewProps> // an instance
export type ViewComponentType = ComponentType<ViewProps>

export type ViewConfigInput = ViewComponentType | ViewOptions
export type ViewConfigInputHash = { [viewType: string]: ViewConfigInput }

export interface ViewConfig {
  superType: string
  component: ViewComponentType | null
  rawOptions: ViewOptions
}

export type ViewConfigHash = { [viewType: string]: ViewConfig }

export function parseViewConfigs(inputs: ViewConfigInputHash): ViewConfigHash {
  return mapHash(inputs, parseViewConfig)
}

function parseViewConfig(input: ViewConfigInput): ViewConfig {
  let rawOptions: ViewOptions = typeof input === 'function' ?
    { component: input } :
    input
  let { component } = rawOptions

  if (rawOptions.content) {
    // TODO: remove content/classNames/didMount/etc from options?
    component = createViewHookComponent(rawOptions)
  } else if (component && !((component as any).prototype instanceof BaseComponent)) {
    // WHY?: people were using `component` property for `content`
    // TODO: converge on one setting name
    component = createViewHookComponent({ ...rawOptions, content: component })
  }

  return {
    superType: rawOptions.type as any,
    component: component as any,
    rawOptions, // includes type and component too :(
  }
}

export interface SpecificViewData extends ViewProps {
  nextDayThreshold: Duration
}

export type SpecificViewMountData = MountData<SpecificViewData>

function createViewHookComponent(options: ViewOptions) {
  return (viewProps: ViewProps) => (
    <ViewContextType.Consumer>
      {(context: ViewContext) => (
        <ContentContainer
          tag="div"
          className={
            generateClassName(options.viewClass, {
              view: context.viewApi,
            })
          }
          renderProps={{
            ...viewProps,
            nextDayThreshold: options.nextDayThreshold,
          }}
          generatorName={undefined}
          customGenerator={options.content as any}
          classNameGenerator={(options.class ?? options.className) as any}
          didMount={options.didMount as any}
          willUnmount={options.willUnmount as any}
        />
      )}
    </ViewContextType.Consumer>
  )
}
