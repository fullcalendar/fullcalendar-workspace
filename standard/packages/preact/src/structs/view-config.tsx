import { ViewProps } from '../component-util/View'
import { mapHash } from '../util/object'
import { type ComponentType, Component } from 'react'
import { MountData } from '../common/render-hook'
import { ViewContextType } from '../ViewContext'
import { ViewOptions } from '../options'
import { Duration } from '@full-ui/headless-calendar'
import { ContentContainer, generateClassName } from '../content-inject/ContentContainer'
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
    <ViewContextType.Consumer
      children={(context) => (
        <ContentContainer
          tag="div"
          className={
            generateClassName(options.viewClass, {
              view: context.viewApi,
              ...computeViewBorderless(context.options),
              isFirst: !context.options.headerToolbar,
              isLast: !context.options.footerToolbar,
              isHeightAuto: context.options.height === 'auto' || context.options.contentHeight === 'auto',
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
    />
  )
}
