import { CalendarInteraction } from './calendar-utils'
import { ViewProps } from './component-util/View'
import { DateComponent } from './component/DateComponent'
import { Toolbar } from './component/Toolbar'
import { EventClicking } from './interactions/EventClicking'
import { EventHovering } from './interactions/EventHovering'
import {
  Interaction, InteractionClass, InteractionSettingsInput, interactionSettingsStore, parseInteractionSettings
} from './interactions/interaction'
import classNames from './internal-classnames'
import { generateClassName } from './internal'
import { ViewPropsTransformerClass } from './plugin-system-struct'
import { type ReactElement } from 'react'
import { CalendarData, CalendarToolbarProps } from './reducers/data-types'
import { CssDimValue, getIsHeightAuto } from './scrollgrid/util'
import { getUniqueDomId } from './util/dom-manip'
import { joinClassNames } from './util/html'
import { memoize } from './util/memoize'
import { buildViewContext, ViewContextType } from './ViewContext'
import { PureComponent } from './vdom-util'

export interface CalendarInnerProps extends CalendarData {
  forPrint: boolean
}

// hook for public api
export interface CalendarContentProps extends CalendarData {
  toolbarProps: CalendarToolbarProps
  forPrint: boolean
}

export class CalendarInner extends PureComponent<CalendarInnerProps> {
  private buildViewContext = memoize(buildViewContext)
  private buildViewPropTransformers = memoize(buildViewPropTransformers)
  private interactionsStore: { [componentUid: string]: Interaction[] } = {}
  private calendarInteractions: CalendarInteraction[] = []
  private viewTitleId = getUniqueDomId()

  render() {
    const { props } = this

    let { toolbarConfig, options } = props

    let viewHeight: CssDimValue | undefined
    let viewHeightLiquid = false
    let viewAspectRatio: number | undefined

    if (props.forPrint || getIsHeightAuto(options)) {
      ;
    } else if (options.height != null) {
      viewHeightLiquid = true
    } else if (options.contentHeight != null) {
      viewHeight = options.contentHeight
    } else {
      viewAspectRatio = Math.max(options.aspectRatio, 0.5) // prevent from getting too tall
    }

    let viewContext = this.buildViewContext(
      props.viewSpec,
      props.viewApi,
      props.options,
      props.dateProfileGenerator,
      props.dateEnv,
      props.nowManager,
      props.pluginHooks,
      props.dispatch,
      props.getCurrentData,
      props.emitter,
      props.calendarApi,
      this.registerInteractiveComponent,
      this.unregisterInteractiveComponent,
    )
    let borderlessX = options.borderlessX ?? options.borderless // TODO: DRY

    return (
      <ViewContextType.Provider value={viewContext}>
        {toolbarConfig.header && (
          <Toolbar
            className={generateClassName(options.headerToolbarClass, { borderlessX })}
            model={toolbarConfig.header}
            borderlessX={borderlessX}
            titleId={this.viewTitleId}
            {...props.toolbarProps}
          />
        )}
        <div
          className={joinClassNames(
            classNames.flexCol,
            classNames.rel,
            viewHeightLiquid && classNames.liquid,
          )}
          style={{
            height: viewHeight,
            paddingBottom: viewAspectRatio != null
              ? `${(1 / viewAspectRatio) * 100}%`
              : undefined
          }}
        >
          {this.renderView(
            joinClassNames(
              (viewHeightLiquid || viewHeight) && classNames.liquid,
              viewAspectRatio != null && classNames.fill,
              classNames.internalView,
            ),
          )}
          {this.buildAppendContent()}
        </div>
        {toolbarConfig.footer && (
          <Toolbar
            className={generateClassName(options.footerToolbarClass, { borderlessX })}
            model={toolbarConfig.footer}
            borderlessX={borderlessX}
            {...props.toolbarProps}
          />
        )}
      </ViewContextType.Provider>
    )
  }

  private renderView(className: string): ReactElement {
    const { props } = this
    const { pluginHooks, viewSpec, toolbarConfig, toolbarProps, options } = props

    // TODO: DRY
    let { borderless } = options
    let calendarBorderlessX = options.borderlessX ?? borderless
    let calendarBorderlessTop = options.borderlessTop ?? borderless
    let calendarBorderlessBottom = options.borderlessBottom ?? borderless

    let viewProps: ViewProps = {
      className,
      dateProfile: props.dateProfile,
      businessHours: props.businessHours,
      eventStore: props.renderableEventStore, // !
      eventUiBases: props.eventUiBases,
      dateSelection: props.dateSelection,
      eventSelection: props.eventSelection,
      eventDrag: props.eventDrag,
      eventResize: props.eventResize,
      forPrint: props.forPrint,
      labelId: toolbarConfig.header && toolbarConfig.header.hasTitle ? this.viewTitleId : undefined,
      labelStr: toolbarConfig.header && toolbarConfig.header.hasTitle ? undefined : toolbarProps.title,
      borderlessX: calendarBorderlessX,
      borderlessTop: toolbarConfig.header ? false : calendarBorderlessTop,
      borderlessBottom: toolbarConfig.footer ? false : calendarBorderlessBottom,
      noEdgeEffects: calendarBorderlessX || calendarBorderlessTop || calendarBorderlessBottom,
    }

    let transformers = this.buildViewPropTransformers(pluginHooks.viewPropsTransformers)

    let contentProps: CalendarContentProps = {
      ...props,
      toolbarProps,
      forPrint: props.forPrint,
    }

    for (let transformer of transformers) {
      Object.assign(
        viewProps,
        transformer.transform(viewProps, contentProps),
      )
    }

    let ViewComponent = viewSpec.component
    return (
      <ViewComponent {...viewProps} />
    )
  }

  private buildAppendContent(): ReactElement {
    const { props } = this
    const children = props.pluginHooks.viewContainerAppends.map(
      (buildAppendContent) => buildAppendContent(props),
    )
    return <>{children}</>
  }

  componentDidMount() {
    const { props } = this

    this.calendarInteractions = props.pluginHooks.calendarInteractions
      .map((CalendarInteractionClass) => new CalendarInteractionClass(props))

    let { propSetHandlers } = props.pluginHooks
    for (let propName in propSetHandlers) {
      propSetHandlers[propName](props[propName], props)
    }
  }

  componentDidUpdate(prevProps: Readonly<CalendarData>): void {
    const { props } = this

    let { propSetHandlers } = props.pluginHooks
    for (let propName in propSetHandlers) {
      if (props[propName] !== prevProps[propName]) {
        propSetHandlers[propName](props[propName], props)
      }
    }
  }

  componentWillUnmount() {
    const { props } = this

    for (let interaction of this.calendarInteractions) {
      interaction.destroy()
    }
    this.calendarInteractions = []

    props.emitter.trigger('_unmount')
  }

  private registerInteractiveComponent = (component: DateComponent<any>, settingsInput: InteractionSettingsInput) => {
    let settings = parseInteractionSettings(component, settingsInput)
    let DEFAULT_INTERACTIONS: InteractionClass[] = [
      EventClicking,
      EventHovering,
    ]

    let interactionClasses = DEFAULT_INTERACTIONS
    if (!settingsInput.disableHits) {
      interactionClasses = interactionClasses.concat(this.props.pluginHooks.componentInteractions)
    }

    let interactions = interactionClasses.map((TheInteractionClass) => new TheInteractionClass(settings))

    this.interactionsStore[component.uid] = interactions
    interactionSettingsStore[component.uid] = settings
  }

  private unregisterInteractiveComponent = (component: DateComponent<any>) => {
    let listeners = this.interactionsStore[component.uid]

    if (listeners) {
      for (let listener of listeners) {
        listener.destroy()
      }
      delete this.interactionsStore[component.uid]
    }

    delete interactionSettingsStore[component.uid]
  }
}

function buildViewPropTransformers(theClasses: ViewPropsTransformerClass[]) {
  return theClasses.map((TheClass) => new TheClass())
}
