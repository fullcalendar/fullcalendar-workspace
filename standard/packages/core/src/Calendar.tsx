import { CalendarInteraction } from './calendar-utils.js'
import { ViewProps } from './component-util/View.js'
import { CalendarRoot } from './component/CalendarRoot.js'
import { DateComponent } from './component/DateComponent.js'
import { Toolbar } from './component/Toolbar.js'
import { RenderId } from './content-inject/RenderId.js'
import { DateMarker, rangeContainsMarker } from '@full-ui/headless-calendar'
import { DateProfile, DateProfileGenerator } from './DateProfileGenerator.js'
import { EventClicking } from './interactions/EventClicking.js'
import { EventHovering } from './interactions/EventHovering.js'
import {
  Interaction, InteractionClass, InteractionSettingsInput, interactionSettingsStore, parseInteractionSettings
} from './interactions/interaction.js'
import classNames from './internal-classnames.js'
import { generateClassName } from './internal.js'
import { NowTimer } from './NowTimer.js'
import { CalendarOptions } from './options.js'
import { ViewPropsTransformerClass } from './plugin-system-struct.js'
import { createElement, Fragment, createRoot, flushSync, VNode } from './preact.js'
import { Action } from './reducers/Action.js'
import { CalendarDataManager } from './reducers/CalendarDataManager.js'
import { CalendarData } from './reducers/data-types.js'
import { CssDimValue, getIsHeightAuto } from './scrollgrid/util.js'
import { NavButtonState, ButtonStateMap } from './structs/button-state.js'
import { ViewSpec } from './structs/view-spec.js'
import { DelayedRunner } from './util/DelayedRunner.js'
import { applyStyleProp, getUniqueDomId } from './util/dom-manip.js'
import { joinClassNames } from './util/html.js'
import { memoize } from './util/memoize.js'
import { formatWithOrdinals } from './util/misc.js'
import { CalendarImpl } from './api/CalendarImpl.js'
import { buildViewContext, ViewContextType } from './ViewContext.js'

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

/*
Vanilla JS API
*/
export class Calendar extends CalendarImpl {
  el: HTMLElement

  private vdomRoot: { render: (vdomNode: any) => any } // TODO
  private buildToolbarProps = memoize(buildToolbarProps)
  private buildViewContext = memoize(buildViewContext)
  private buildViewPropTransformers = memoize(buildViewPropTransformers)
  private toolbarProps?: CalendarToolbarProps
  private currentData: CalendarData
  private prevData: CalendarData | null = null
  private renderRunner: DelayedRunner
  private isRendering = false
  private isRendered = false
  private currentClassName = ''
  private customContentRenderId = 0
  private interactionsStore: { [componentUid: string]: Interaction[] } = {}
  private calendarInteractions: CalendarInteraction[] = []
  private viewTitleId = getUniqueDomId()

  constructor(el: HTMLElement, optionOverrides: CalendarOptions = {}) {
    super()

    this.el = el
    this.vdomRoot = createRoot(el)
    this.renderRunner = new DelayedRunner(this.handleRenderRequest)

    new CalendarDataManager({ // eslint-disable-line no-new
      optionOverrides,
      calendarApi: this,
      onAction: this.handleAction,
      onData: this.handleData,
    })
  }

  private handleAction = (action: Action) => {
    // actions we know we want to render immediately
    switch (action.type) {
      case 'SET_EVENT_DRAG':
      case 'SET_EVENT_RESIZE':
        this.renderRunner.tryDrain()
    }
  }

  private handleData = (data: CalendarData) => {
    this.currentData = data
    this.renderRunner.request(data.calendarOptions.rerenderDelay)
  }

  private handleRenderRequest = () => {
    if (this.isRendering) {
      let { currentData, prevData } = this
      let isFirstRender = !this.isRendered
      this.isRendered = true

      flushSync(() => {
        this.vdomRoot.render(
          <CalendarRoot options={currentData.calendarOptions} emitter={currentData.emitter}>
            {(isRtl: boolean, className: string, height: number, forPrint: boolean) => {
              this.setIsRtl(isRtl)
              this.setClassName(className)
              this.setHeight(height)

              return (
                <RenderId.Provider value={this.customContentRenderId}>
                  {this.renderContent(currentData, forPrint)}
                </RenderId.Provider>
              )
            }}
          </CalendarRoot>,
        )
      })

      // Handle lifecycle-equivalent logic after render
      if (isFirstRender) {
        this.handleContentMount(currentData)
      } else if (prevData) {
        this.handleContentUpdate(currentData, prevData)
      }

      this.prevData = currentData
    } else if (this.isRendered) {
      this.isRendered = false
      this.handleContentUnmount()
      this.vdomRoot.render(null)

      this.setIsRtl(false)
      this.setClassName('')
      this.setHeight('')
      this.prevData = null
    }
  }

  private renderContent(data: CalendarData, forPrint: boolean): VNode {
    let { toolbarConfig, options } = data

    let viewHeight: CssDimValue | undefined
    let viewHeightLiquid = false
    let viewAspectRatio: number | undefined

    if (forPrint || getIsHeightAuto(options)) {
      ;
    } else if (options.height != null) {
      viewHeightLiquid = true
    } else if (options.contentHeight != null) {
      viewHeight = options.contentHeight
    } else {
      viewAspectRatio = Math.max(options.aspectRatio, 0.5) // prevent from getting too tall
    }

    let viewContext = this.buildViewContext(
      data.viewSpec,
      data.viewApi,
      data.options,
      data.dateProfileGenerator,
      data.dateEnv,
      data.nowManager,
      data.pluginHooks,
      data.dispatch,
      data.getCurrentData,
      data.emitter,
      data.calendarApi,
      this.registerInteractiveComponent,
      this.unregisterInteractiveComponent,
    )
    let borderlessX = options.borderlessX ?? options.borderless // TODO: DRY

    return (
      <ViewContextType.Provider value={viewContext}>
        <NowTimer unit="day">
          {(nowDate: DateMarker) => {
            const toolbarProps = this.toolbarProps = this.buildToolbarProps(
              data.viewSpec,
              data.dateProfile,
              data.dateProfileGenerator,
              data.currentDate,
              nowDate,
              data.viewTitle,
            )

            return (
              <Fragment>
                {toolbarConfig.header && (
                  <Toolbar
                    className={generateClassName(options.headerToolbarClass, { borderlessX })}
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
                  )}
                  style={{
                    height: viewHeight,
                    paddingBottom: viewAspectRatio != null
                      ? `${(1 / viewAspectRatio) * 100}%`
                      : undefined
                  }}
                >
                  {this.renderView(
                    data,
                    toolbarProps,
                    forPrint,
                    joinClassNames(
                      (viewHeightLiquid || viewHeight) && classNames.liquid,
                      viewAspectRatio != null && classNames.fill,
                      classNames.internalView,
                    ),
                  )}
                  {this.buildAppendContent(data)}
                </div>
                {toolbarConfig.footer && (
                  <Toolbar
                    className={generateClassName(options.footerToolbarClass, { borderlessX })}
                    model={toolbarConfig.footer}
                    borderlessX={borderlessX}
                    {...toolbarProps}
                  />
                )}
              </Fragment>
            )
          }}
        </NowTimer>
      </ViewContextType.Provider>
    )
  }

  private renderView(data: CalendarData, toolbarProps: CalendarToolbarProps, forPrint: boolean, className: string): VNode {
    let { pluginHooks, viewSpec, toolbarConfig, options } = data

    // TODO: DRY
    let { borderless } = options
    let calendarBorderlessX = options.borderlessX ?? borderless
    let calendarBorderlessTop = options.borderlessTop ?? borderless
    let calendarBorderlessBottom = options.borderlessBottom ?? borderless

    let viewProps: ViewProps = {
      className,
      dateProfile: data.dateProfile,
      businessHours: data.businessHours,
      eventStore: data.renderableEventStore, // !
      eventUiBases: data.eventUiBases,
      dateSelection: data.dateSelection,
      eventSelection: data.eventSelection,
      eventDrag: data.eventDrag,
      eventResize: data.eventResize,
      forPrint,
      labelId: toolbarConfig.header && toolbarConfig.header.hasTitle ? this.viewTitleId : undefined,
      labelStr: toolbarConfig.header && toolbarConfig.header.hasTitle ? undefined : toolbarProps.title,
      borderlessX: calendarBorderlessX,
      borderlessTop: toolbarConfig.header ? false : calendarBorderlessTop,
      borderlessBottom: toolbarConfig.footer ? false : calendarBorderlessBottom,
      noEdgeEffects: calendarBorderlessX || calendarBorderlessTop || calendarBorderlessBottom,
    }

    let transformers = this.buildViewPropTransformers(pluginHooks.viewPropsTransformers)

    let contentProps: CalendarContentProps = {
      ...data,
      toolbarProps,
      forPrint,
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

  private buildAppendContent(data: CalendarData): VNode {
    let children = data.pluginHooks.viewContainerAppends.map(
      (buildAppendContent) => buildAppendContent(data),
    )

    return createElement(Fragment, {}, ...children)
  }

  private handleContentMount(data: CalendarData): void {
    this.calendarInteractions = data.pluginHooks.calendarInteractions
      .map((CalendarInteractionClass) => new CalendarInteractionClass(data))

    let { propSetHandlers } = data.pluginHooks
    for (let propName in propSetHandlers) {
      propSetHandlers[propName](data[propName], data)
    }
  }

  private handleContentUpdate(data: CalendarData, prevData: CalendarData): void {
    let { propSetHandlers } = data.pluginHooks
    for (let propName in propSetHandlers) {
      if (data[propName] !== prevData[propName]) {
        propSetHandlers[propName](data[propName], data)
      }
    }
  }

  private handleContentUnmount(): void {
    for (let interaction of this.calendarInteractions) {
      interaction.destroy()
    }
    this.calendarInteractions = []

    this.currentData.emitter.trigger('_unmount')
  }

  private registerInteractiveComponent = (component: DateComponent<any>, settingsInput: InteractionSettingsInput) => {
    let settings = parseInteractionSettings(component, settingsInput)
    let DEFAULT_INTERACTIONS: InteractionClass[] = [
      EventClicking,
      EventHovering,
    ]

    let interactionClasses = DEFAULT_INTERACTIONS
    if (!settingsInput.disableHits) {
      interactionClasses = interactionClasses.concat(this.currentData.pluginHooks.componentInteractions)
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

  render() {
    let wasRendering = this.isRendering

    if (!wasRendering) {
      this.isRendering = true
    } else {
      this.customContentRenderId += 1
    }

    this.renderRunner.request()

    if (wasRendering) {
      this.updateSize()
    }
  }

  destroy(): void {
    if (this.isRendering) {
      this.isRendering = false
      this.renderRunner.request()
    }
  }

  batchRendering(func): void {
    this.renderRunner.pause('batchRendering')
    func()
    this.renderRunner.resume('batchRendering')
  }

  pauseRendering() { // available to plugins
    this.renderRunner.pause('pauseRendering')
  }

  resumeRendering() { // available to plugins
    this.renderRunner.resume('pauseRendering', true)
  }

  resetOptions(optionOverrides, changedOptionNames?: string[]) {
    this.currentDataManager.resetOptions(optionOverrides, changedOptionNames)
  }

  /*
  TODO: DRY with toolbar-parse.ts and ToolbarSection
  */
  getButtonState(): ButtonStateMap {
    const { currentData, toolbarProps } = this
    const options = currentData.calendarOptions
    const buttonConfigs = options.buttons || {}
    const viewSpecs = currentData.viewSpecs

    const buttonState: ButtonStateMap = {
      today: {
        text: options.todayText,
        hint: options.todayHint as string,
        isDisabled: !toolbarProps.isTodayEnabled,
      } as NavButtonState,

      prev: {
        text: options.prevText,
        hint: options.prevHint as string,
        isDisabled: !toolbarProps.isPrevEnabled,
      } as NavButtonState,

      next: {
        text: options.nextText,
        hint: options.nextHint as string,
        isDisabled: !toolbarProps.isNextEnabled,
      } as NavButtonState,

      prevYear: {
        text: options.prevYearText,
        hint: formatWithOrdinals(options.prevHint, [options.yearText, 'year'], options.prevYearText),
        isDisabled: false,
      } as NavButtonState,

      nextYear: {
        text: options.prevYearText,
        hint: formatWithOrdinals(options.nextHint, [options.yearText, 'year'], options.nextYearText),
        isDisabled: false,
      } as NavButtonState,
    }

    for (const viewSpecName in viewSpecs) {
      const viewSpec = viewSpecs[viewSpecName]
      const buttonTextKey = viewSpec.optionDefaults.buttonTextKey as string

      const buttonText =
        buttonConfigs[viewSpecName]?.text ||
        (buttonTextKey ? options[buttonTextKey] : '') ||
        (viewSpec.singleUnit ? options[viewSpec.singleUnit + 'Text'] : '') ||
        viewSpecName

      const buttonHint = formatWithOrdinals(
        options.viewHint,
        [buttonText, viewSpecName], // ordinal arguments
        buttonText, // fallback text
      )

      buttonState[viewSpecName] = {
        text: buttonText,
        hint: buttonHint,
      }
    }

    return buttonState
  }

  private setClassName(className: string) {
    if (className !== this.currentClassName) {
      let { classList } = this.el

      for (let singleClassName of this.currentClassName.split(' ')) {
        if (singleClassName) {
          classList.remove(singleClassName)
        }
      }

      for (let singleClassName of className.split(' ')) {
        if (singleClassName) {
          classList.add(singleClassName)
        }
      }

      this.currentClassName = className
    }
  }

  private setHeight(height: CssDimValue) {
    applyStyleProp(this.el, 'height', height)
  }

  private setIsRtl(isRtl: boolean) {
    if (isRtl) {
      this.el.dir = 'rtl'
    } else {
      this.el.removeAttribute('dir')
    }
  }
}

function buildToolbarProps(
  viewSpec: ViewSpec,
  dateProfile: DateProfile,
  dateProfileGenerator: DateProfileGenerator,
  currentDate: DateMarker,
  now: DateMarker,
  title: string,
): CalendarToolbarProps {
  // don't force any date-profiles to valid date profiles (the `false`) so that we can tell if it's invalid
  let todayInfo = dateProfileGenerator.build(now, undefined, false) // TODO: need `undefined` or else INFINITE LOOP for some reason
  let prevInfo = dateProfileGenerator.buildPrev(dateProfile, currentDate, false)
  let nextInfo = dateProfileGenerator.buildNext(dateProfile, currentDate, false)

  return {
    title,
    selectedButton: viewSpec.type,
    navUnit: viewSpec.singleUnit,
    isTodayEnabled: todayInfo.isValid && !rangeContainsMarker(dateProfile.currentRange, now),
    isPrevEnabled: prevInfo.isValid,
    isNextEnabled: nextInfo.isValid,
  }
}

function buildViewPropTransformers(theClasses: ViewPropsTransformerClass[]) {
  return theClasses.map((TheClass) => new TheClass())
}
