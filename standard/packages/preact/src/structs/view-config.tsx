import { ViewDisplayPropsExtra, ViewProps } from '../component-util/View'
import { mapHash } from '../util/object'
import { type ComponentType, Component } from 'react'
import { ViewContextType } from '../ViewContext'
import { ViewOptions } from '../options'
import { ContentContainer } from '../content-inject/ContentContainer'
import { Duration } from '@full-ui/headless-calendar'
import { BaseComponent } from '../vdom-util'
import { computeViewBorderless } from '../util/misc'

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

  if (rawOptions.viewContent) {
    // TODO: remove content/classNames/didMount/etc from options?
    component = createViewHookComponent(rawOptions)
  } else if (component && !((component as any).prototype instanceof BaseComponent)) {
    // WHY?: people were using `component` property for `content`
    // TODO: converge on one setting name
    component = createViewHookComponent({ ...rawOptions, viewContent: component as any })
  }

  return {
    superType: rawOptions.type as any,
    component: component as any,
    rawOptions, // includes type and component too :(
  }
}

function createViewHookComponent(options: ViewOptions) {
  return (viewProps: ViewProps) => (
    <ViewContextType.Consumer
      children={(context) => {
        const renderProps: ViewDisplayPropsExtra = {
          // ViewDisplayProp...
          ...computeViewBorderless(context.options),
          isFirst: !context.options.headerToolbar,
          isLast: !context.options.footerToolbar,
          isHeightAuto: context.options.height === 'auto' || context.options.contentHeight === 'auto',
          view: context.viewApi,
          // the "extra" props, for sliceEvents...
          ...viewProps,
          nextDayThreshold: options.nextDayThreshold as Duration,
        }

        return (
          <ContentContainer
            tag="div"
            classNameGenerator={options.viewClass}
            renderProps={renderProps}
            generatorName={undefined}
            customGenerator={options.viewContent}
            didMount={options.viewDidMount}
            willUnmount={options.viewWillUnmount}
          />
        )
      }}
    />
  )
}
