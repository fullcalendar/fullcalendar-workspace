import { ViewContentInfo, ViewProps } from '../component-util/View'
import { mapHash } from '../util/object'
import { type ComponentType, type FunctionComponent, Component, useMemo } from 'react'
import { ViewOptions } from '../options'
import { CustomContent } from '../content-inject/CustomContent'
import { useViewContext } from '../hooks/useViewContext'
import { useRenderHookEl } from '../hooks/useRenderHookEl'
import { Duration } from '@full-ui/headless-calendar'
import { memoWithEquality } from '../vdom-util'
import { computeViewBorderless } from '../util/misc'
import { ContentGenerator, generateClassName } from '../common/render-hook'
import { getIsHeightAuto } from '../scrollgrid/util'
import { joinClassNames } from '../public-api'

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

const viewComponents = new WeakSet<object>()

/*
A view's component from its body: memoized on its props (shallowly), and marked, so parseViewConfig
takes it as a view rather than as `content` given as `component`
*/
export function createViewComponent<Props extends ViewProps>(body: FunctionComponent<Props>): ComponentType<Props> {
  const component = memoWithEquality(body, {})
  viewComponents.add(component)
  return component as ComponentType<Props>
}

function isViewComponent(component: any): boolean {
  return viewComponents.has(component)
}

export function parseViewConfigs(inputs: ViewConfigInputHash): ViewConfigHash {
  return mapHash(inputs, parseViewConfig)
}

function parseViewConfig(input: ViewConfigInput): ViewConfig {
  // a component: a function, or a view component (React's memo() is an object)
  let rawOptions: ViewOptions = (typeof input === 'function' || viewComponents.has(input as object)) ?
    { component: input as ViewComponentType } :
    input as ViewOptions

  let { component } = rawOptions

  if (rawOptions.content) {
    component = createViewHookComponent(rawOptions.content)
  } else if (component && !isViewComponent(component)) {
    // WHY?: people were using `component` property for `content`
    // TODO: converge on one setting name
    component = createViewHookComponent(component as any)
  }

  return {
    superType: rawOptions.type,
    component: component as any,
    rawOptions, // includes type and component too :(
  }
}

/*
TODO: converge with ViewContainer
*/
function createViewHookComponent(contentGenerator: ContentGenerator<ViewContentInfo>) {
  return function ViewHookComponent(viewProps: ViewProps) {
    const context = useViewContext()
    const { options, viewSpec } = context
    const { headerToolbar, footerToolbar } = options
    const toolbarOptions = useMemo(() => ({ headerToolbar, footerToolbar }), [headerToolbar, footerToolbar])
    const renderProps: ViewContentInfo = {
      // the "extra" props, for sliceEvents...
      ...viewProps,
      nextDayThreshold: options.nextDayThreshold as Duration,
      // ViewDisplayInfo...
      ...computeViewBorderless(options),
      options: toolbarOptions,
      isHeightAuto: getIsHeightAuto(options),
      view: context.viewApi,
    }
    const renderHookEl = useRenderHookEl({
      classGenerator: undefined,
      didMount: options.didMount || (options as any).viewDidMount, // TODO: should call both
      willUnmount: options.willUnmount || (options as any).viewWillUnmount, // TODO: should call both
      renderProps,
    })

    return (
      <CustomContent
        tag="div"
        className={joinClassNames(
          generateClassName((options as any).viewClass, renderProps),
          // WORKAROUND for way calendar's className would get merged into view's className
          generateClassName(viewSpec.optionDefaults.class, renderProps),
          generateClassName(viewSpec.optionDefaults.className, renderProps),
          generateClassName(viewSpec.optionOverrides.class, renderProps),
          generateClassName(viewSpec.optionOverrides.className, renderProps),
        )}
        elRef={renderHookEl.ref}
        renderProps={renderProps}
        generatorName={undefined}
        generator={contentGenerator}
      />
    )
  }
}
