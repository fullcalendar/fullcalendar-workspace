import { CalendarInteraction } from './calendar-utils'
import { ViewProps } from './component-util/View'
import { Toolbar } from './component/Toolbar'
import { EventClicking } from './interactions/EventClicking'
import { EventHovering } from './interactions/EventHovering'
import { Interaction, InteractionClass } from './interactions/interaction'
import { HitTarget, hitTargetStore } from './interactions/hit-target'
import classNames from './styles.module.css'
import { ViewPropsTransformerClass } from './plugin-system-struct'
import { type ReactElement, Fragment, useRef, useState } from 'react'
import { CalendarData, CalendarToolbarProps } from './reducers/data-types'
import { CssDimValue, getIsHeightAuto } from './scrollgrid/util'

import { joinClassNames } from './util/html'
import { memoize } from './util/memoize'
import { useIsomorphicLayoutEffect } from './hooks/useIsomorphicLayoutEffect'
import { buildViewContext, ViewContextType } from './ViewContext'
import {
  CalendarCoreContext,
  DateEnvContext,
  PluginHooksContext,
  ViewOptionsContext,
  ViewSpecContext,
  buildCalendarCore,
  buildViewSpecContextValue,
} from './granular-contexts'
import { memoWithEquality } from './vdom-util'

export interface CalendarInnerProps extends CalendarData {
  forPrint: boolean
  baseId: string
}

// hook for public api
export interface CalendarContentProps extends CalendarData {
  toolbarProps: CalendarToolbarProps
  forPrint: boolean
}

/*
The calendar's content: the toolbars and the view, inside the view contexts it provides. Memoized on its
props, as the class it was (a PureComponent). Its memos, interactions and hit-target registry live on one
CalendarInnerState, made once
*/
export const CalendarInner = memoWithEquality(function CalendarInner(props: CalendarInnerProps) {
  const [inner] = useState(() => new CalendarInnerState())
  const prevPropsRef = useRef<CalendarInnerProps | null>(null)

  // as a class instance's this.props: hit targets the children register in this render's commit read it
  inner.props = props

  // layout timing, like the componentDidMount/DidUpdate it replaces
  useIsomorphicLayoutEffect(() => {
    const prevProps = prevPropsRef.current
    prevPropsRef.current = props

    if (prevProps) {
      inner.didUpdate(prevProps)
    } else {
      inner.didMount()
    }
  })

  useIsomorphicLayoutEffect(() => () => {
    inner.willUnmount()
    prevPropsRef.current = null // a remount (Strict Mode, <Activity>) mounts again
  }, [])

  return inner.render()
}, {})

class CalendarInnerState {
  props: CalendarInnerProps

  private buildViewContext = memoize(buildViewContext)
  private buildCalendarCore = memoize(buildCalendarCore)
  private buildViewSpecContextValue = memoize(buildViewSpecContextValue)
  private buildViewPropTransformers = memoize(buildViewPropTransformers)
  private interactionsStore: { [componentUid: string]: Interaction[] } = {}
  private calendarInteractions: CalendarInteraction[] = []

  private get viewTitleId() {
    return this.props.baseId + 'title'
  }

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
      props.baseId,
      this.registerHitTarget,
      this.unregisterHitTarget,
    )
    let calendarCore = this.buildCalendarCore(
      props.calendarApi,
      props.dispatch,
      props.emitter,
      props.getCurrentData,
      props.nowManager,
      props.baseId,
      this.registerHitTarget,
      this.unregisterHitTarget,
    )
    let viewSpecContextValue = this.buildViewSpecContextValue(
      props.viewSpec,
      props.viewApi,
      props.dateProfileGenerator,
    )

    // the facade, then its parts (granular-contexts.ts)
    return (
      <ViewContextType.Provider value={viewContext}>
        <CalendarCoreContext.Provider value={calendarCore}>
        <PluginHooksContext.Provider value={props.pluginHooks}>
        <DateEnvContext.Provider value={props.dateEnv}>
        <ViewSpecContext.Provider value={viewSpecContextValue}>
        <ViewOptionsContext.Provider value={props.options}>
        {toolbarConfig.header && (
          <Toolbar
            model={toolbarConfig.header}
            isHeader={true}
            titleId={this.viewTitleId}
            {...props.toolbarProps}
          />
        )}
        <div // wrapper needed for containing license message
          className={joinClassNames(
            classNames.flexCol,
            classNames.rel,

            // prevents browsers' "scroll anchoring behavior", which cause scroll thrashing
            // when clicking "Next" for month-view, because rows would flex-grow while other rows
            // temporarily removed. This behavior probably universally unhelpful for our uses,
            // esp with virtualization, but maybe in future put on more specific row-based parents
            classNames.overflowAnchorNone,

            // workaround for Safari pushing content area extremely wide after returning from
            // print-view. probably a good idea regardless, to circumvent 'auto' dimentions
            classNames.minHeight0,

            viewHeightLiquid && classNames.liquid,
          )}
          style={{
            height: viewHeight,
            aspectRatio: viewAspectRatio != null ? String(viewAspectRatio) : undefined,
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
            model={toolbarConfig.footer}
            isHeader={false}
            {...props.toolbarProps}
          />
        )}
        </ViewOptionsContext.Provider>
        </ViewSpecContext.Provider>
        </DateEnvContext.Provider>
        </PluginHooksContext.Provider>
        </CalendarCoreContext.Provider>
      </ViewContextType.Provider>
    )
  }

  private renderView(className: string): ReactElement {
    const { props } = this
    const { pluginHooks, viewSpec, toolbarConfig, toolbarProps } = props

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
    return (
      <>
        {props.pluginHooks.viewContainerAppends.map((buildAppendContent, i) => (
          <Fragment key={i}>{buildAppendContent(props)}</Fragment>
        ))}
      </>
    )
  }

  // BE AWARE React StrictMode might execute this twice
  didMount() {
    const { props } = this

    this.calendarInteractions = props.pluginHooks.calendarInteractions
      .map((CalendarInteractionClass) => new CalendarInteractionClass(props))

    // before callbacks like datesSet, so the controller receives them, and so they can replace it.
    // also rebinds after StrictMode and <Activity> remounts
    props.syncController(props.calendarOptions.controller)

    let { propSetHandlers } = props.pluginHooks
    for (let propName in propSetHandlers) {
      propSetHandlers[propName](props[propName], props)
    }

    // call contextInit
    for (let callback of props.pluginHooks.contextInit) {
      callback(props)
    }
  }

  didUpdate(prevProps: Readonly<CalendarData>): void {
    const { props } = this

    // before callbacks like datesSet, so a replacement controller receives them
    props.syncController(props.calendarOptions.controller)

    let { propSetHandlers } = props.pluginHooks
    for (let propName in propSetHandlers) {
      if (props[propName] !== prevProps[propName]) {
        propSetHandlers[propName](props[propName], props)
      }
    }
  }

  // BE AWARE React StrictMode might execute this twice
  willUnmount() {
    const { props } = this

    for (let interaction of this.calendarInteractions) {
      interaction.destroy()
    }
    this.calendarInteractions = []

    // will likely undo what was done by contextInit
    props.emitter.trigger('_unmount')
  }

  private registerHitTarget = (target: HitTarget) => {
    this.unregisterHitTarget(target.uid) // in case it registers again without unregistering

    let DEFAULT_INTERACTIONS: InteractionClass[] = [
      EventClicking,
      EventHovering,
    ]

    let interactionClasses = DEFAULT_INTERACTIONS
    if (!target.disableHits) {
      interactionClasses = interactionClasses.concat(this.props.pluginHooks.componentInteractions)
    }

    let interactions = interactionClasses.map((TheInteractionClass) => new TheInteractionClass(target))

    this.interactionsStore[target.uid] = interactions
    hitTargetStore[target.uid] = target
  }

  private unregisterHitTarget = (uid: string) => {
    let listeners = this.interactionsStore[uid]

    if (listeners) {
      for (let listener of listeners) {
        listener.destroy()
      }
      delete this.interactionsStore[uid]
    }

    delete hitTargetStore[uid]
  }
}

function buildViewPropTransformers(theClasses: ViewPropsTransformerClass[]) {
  return theClasses.map((TheClass) => new TheClass())
}
