import { CalendarInteraction } from '../calendar-utils.js'
import { ViewProps } from '../component-util/View.js'
import { EventClicking } from '../interactions/EventClicking.js'
import { EventHovering } from '../interactions/EventHovering.js'
import {
  Interaction, InteractionClass, InteractionSettingsInput, interactionSettingsStore, parseInteractionSettings
} from '../interactions/interaction.js'
import classNames from '../internal-classnames.js'
import { ViewPropsTransformerClass } from '../plugin-system-struct.js'
import { createElement, Fragment, VNode } from '../preact.js'
import { CalendarData } from '../reducers/data-types.js'
import { CssDimValue, getIsHeightAuto } from '../scrollgrid/util.js'
import { getUniqueDomId } from '../util/dom-manip.js'
import { joinClassNames } from '../util/html.js'
import { memoize } from '../util/memoize.js'
import { PureComponent } from '../vdom-util.js'
import { buildViewContext, ViewContextType } from '../ViewContext.js'
import { DateComponent } from './DateComponent.js'
import { Toolbar } from './Toolbar.js'

export interface CalendarContentProps extends CalendarData {
  toolbarProps: CalendarToolbarProps
  forPrint: boolean
}

export interface CalendarToolbarProps {
  title: string
  selectedButton: string
  navUnit: string
  isTodayEnabled: boolean
  isPrevEnabled: boolean
  isNextEnabled: boolean
}

export class CalendarContent extends PureComponent<CalendarContentProps> {
  private buildViewContext = memoize(buildViewContext)
  private buildViewPropTransformers = memoize(buildViewPropTransformers)
  private interactionsStore: { [componentUid: string]: Interaction[] } = {}
  private calendarInteractions: CalendarInteraction[]
  private viewTitleId = getUniqueDomId()

  /*
  renders INSIDE of an outer div
  */
  render() {
    let { props } = this
    let { toolbarProps, toolbarConfig, options } = props

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
            name='header'
            model={toolbarConfig.header}
            borderlessX={borderlessX}
            titleId={this.viewTitleId}
            {...toolbarProps}
          />
        )}
        <div
          className={joinClassNames(
            classNames.flexCol,
            classNames.rel,
            viewHeightLiquid && classNames.liquid,
            classNames.internalViewOuter,
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
            toolbarProps.title,
          )}
          {this.buildAppendContent()}
        </div>
        {toolbarConfig.footer && (
          <Toolbar
            name='footer'
            model={toolbarConfig.footer}
            borderlessX={borderlessX}
            {...toolbarProps}
          />
        )}
      </ViewContextType.Provider>
    )
  }

  componentDidMount() {
    let { props } = this

    this.calendarInteractions = props.pluginHooks.calendarInteractions
      .map((CalendarInteractionClass) => new CalendarInteractionClass(props))

    let { propSetHandlers } = props.pluginHooks
    for (let propName in propSetHandlers) {
      propSetHandlers[propName](props[propName], props)
    }
  }

  componentDidUpdate(prevProps: CalendarContentProps) {
    let { props } = this

    let { propSetHandlers } = props.pluginHooks
    for (let propName in propSetHandlers) {
      if (props[propName] !== prevProps[propName]) {
        propSetHandlers[propName](props[propName], props)
      }
    }
  }

  componentWillUnmount() {
    for (let interaction of this.calendarInteractions) {
      interaction.destroy()
    }

    this.props.emitter.trigger('_unmount')
  }

  buildAppendContent(): VNode {
    let { props } = this

    let children = props.pluginHooks.viewContainerAppends.map(
      (buildAppendContent) => buildAppendContent(props),
    )

    return createElement(Fragment, {}, ...children)
  }

  renderView(className: string, title: string) {
    let { props } = this
    let { pluginHooks, viewSpec, toolbarConfig, options } = props
    let { borderless } = options

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
      labelStr: toolbarConfig.header && toolbarConfig.header.hasTitle ? undefined : title,
      borderlessX: options.borderlessX ?? borderless,
      borderlessTop: toolbarConfig.header ? false : (options.borderlessTop ?? borderless),
      borderlessBottom: toolbarConfig.footer ? false :(options.borderlessBottom ?? borderless),
    }

    let transformers = this.buildViewPropTransformers(pluginHooks.viewPropsTransformers)

    for (let transformer of transformers) {
      Object.assign(
        viewProps,
        transformer.transform(viewProps, props),
      )
    }

    let ViewComponent = viewSpec.component

    return (
      <ViewComponent {...viewProps} />
    )
  }

  // Component Registration
  // -----------------------------------------------------------------------------------------------------------------

  registerInteractiveComponent = (component: DateComponent<any>, settingsInput: InteractionSettingsInput) => {
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

  unregisterInteractiveComponent = (component: DateComponent<any>) => {
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


// Plugin
// -----------------------------------------------------------------------------------------------------------------

function buildViewPropTransformers(theClasses: ViewPropsTransformerClass[]) {
  return theClasses.map((TheClass) => new TheClass())
}
