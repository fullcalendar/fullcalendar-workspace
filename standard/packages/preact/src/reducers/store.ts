import { memoize, memoizeObjArg } from '../util/memoize'
import { Action } from './Action'
import { DateEnv, DateMarker, OpenDateRange } from '@full-ui/headless-calendar'
import { CalendarApiImpl } from '../api/CalendarApiImpl'
import { EventSourceHash } from '../structs/event-source'
import { ViewSpec } from '../structs/view-spec'
import { mapHash, isPropsEqualShallow } from '../util/object'
import { getDateProfileAnchor } from '../structs/date-profile'
import { DateProfile, DateProfileGenerator, DateProfileGeneratorProps, RenderRangeBuilder } from '../DateProfileGenerator'
import { reduceViewType } from './view-type'
import { getInitialDate, reduceCurrentDate } from './current-date'
import { reduceDynamicOptionOverrides } from './options'
import { reduceDateProfile } from './date-profile'
import { reduceEventSources, initEventSources, reduceEventSourcesNewTimeZone, computeEventSourcesLoading } from './eventSources'
import { reduceEventStore, rezoneEventStoreDates } from './eventStore'
import { reduceDateSelection } from './date-selection'
import { reduceSelectedEvent } from './selected-event'
import { reduceEventDrag } from './event-drag'
import { reduceEventResize } from './event-resize'
import { Emitter } from '../common/Emitter'
import { EventUiHash, EventUi, createEventUi } from '../component-util/event-ui'
import { EventDefHash } from '../structs/event-def'
import { CalendarOptions, CalendarListeners, Dictionary } from '../options'
import { rangeContainsMarker } from '@full-ui/headless-calendar'
import { ViewImpl } from '../api/ViewImpl'
import { parseBusinessHours } from '../structs/business-hours'
import { createEmptyEventStore } from '../structs/event-store'
import { CalendarContext } from '../CalendarContext'
import { CalendarDataManagerState, CalendarDerivedData, CalendarOptionsData, CalendarCurrentViewData, CalendarData } from './data-types'
import { buildTitle } from './title-formatting'
import { CalendarNowManager } from './CalendarNowManager'
import { NowTimerRunner } from '../NowTimerRunner'
import { CalendarController } from '../CalendarController'
import { OptionsRefinerCache } from './options-refiner'
import { createReduceEffects, EffectRunnerMap, ReduceEffects } from './effects'
import { runEventSourceFetch } from './event-source-fetch'
import { OptionChangeEffect, runOptionChange } from './option-change'
import { CalendarActions, CalendarActionsCreator, createCalendarActions } from '../api/calendar-actions'

const CORE_EFFECT_RUNNERS: EffectRunnerMap = {
  fetchEventSource: runEventSourceFetch,
  optionChange: runOptionChange,
}

export interface CalendarStoreConfig {
  calendarApi: CalendarApiImpl // the store attaches itself (calendarApi.store)
  // only notify subscribers while mounted. otherwise changes are held until mount().
  // for React, where a render might never commit, or the calendar might be unmounted
  isMountGated?: boolean
}

// what a drain completed. the new data is store.getData()
export interface CalendarStoreChange {
  completedActions: Action[] // non-idle
  isUrgent: boolean // a drag or resize: render synchronously, without rerenderDelay
  isInCommit: boolean // from inside a React commit (a layout effect), where flushSync isn't allowed
}

export type CalendarStoreListener = (change: CalendarStoreChange) => void

/*
The calendar's state, and the pipeline that reduces actions into it. One per calendar, created together
with its API object (in React, in one useState initializer, so a discarded Strict Mode replay discards
both). See planning/phase-9-store.md
*/
export function createCalendarStore(config: CalendarStoreConfig): CalendarStore {
  return new CalendarStore(config)
}

export type ReducerFunc = (
  currentState: Dictionary | undefined,
  action: Action | undefined,
  context: CalendarContext & CalendarDataManagerState & CalendarDerivedData, // more than just context
  effects: ReduceEffects, // for the side effects it describes (a fetch), instead of performing them
) => Dictionary

export class CalendarStore {
  private computeCurrentViewData = memoize(this._computeCurrentViewData)
  private buildDateProfileGenerator = memoizeObjArg(buildDateProfileGenerator)
  private buildViewApi = memoize(buildViewApi)
  private buildViewUiProps = memoizeObjArg(buildViewUiProps)
  private buildEventUiBySource = memoize(buildEventUiBySource, isPropsEqualShallow)
  private buildEventUiBases = memoize(buildEventUiBases)
  private parseContextBusinessHours = memoizeObjArg(parseContextBusinessHours)
  private buildToolbarProps = memoize(buildToolbarProps)
  private buildTitle = memoize(buildTitle)

  private nowManager = new CalendarNowManager()
  private nowTimer: NowTimerRunner

  private isDrainingActionQueue = false
  private actionQueue: Action[] = []

  /*
  Side effects that users or other objects can observe (callbacks, bindings). They run after the
  reduction that queued them, except during a render-time update(), where they wait for
  flushEffects() after the commit. A render might never commit (Suspense), so it mustn't have them.
  */
  private effectQueue: (() => void)[] = []
  private isMounted = false
  private isInCommit = false
  private pendingActions: Action[] = [] // completed while not mounted, for isMountGated

  /*
  The controller option as of the last commit, and whether unmount() unbound it. Reconciled against
  committed data only, so a render that never commits can't bind its controller
  */
  private committedController: CalendarController | undefined
  private isControllerDetached = false

  private optionOverrides: CalendarOptions = {}
  private config: CalendarStoreConfig
  private listeners: CalendarStoreListener[] = []

  private coreActions: CalendarActions
  private actionsInProgress: (CalendarActions & Dictionary) | undefined
  private buildActions = memoize((creators: CalendarActionsCreator[]) => {
    let actions: CalendarActions & Dictionary = { ...this.coreActions }
    this.actionsInProgress = actions

    try {
      for (let creator of creators) {
        // each gets what's composed so far, a copy, so it can wrap what it replaces
        Object.assign(actions, creator(this, this.config.calendarApi, { ...actions }))
      }
    } finally {
      this.actionsInProgress = undefined
    }

    return actions
  })

  /*
  What changes the calendar. The API's methods, the wrappers and plugins call these. The core's, and
  the plugins' (calendarActions), as of the latest options, so mid-dispatch too. The same object
  while the plugins don't change
  */
  get actions(): CalendarActions & Dictionary {
    if (this.actionsInProgress) { // a creator reading store.actions
      return this.actionsInProgress
    }

    const pluginHooks = this.optionsRefiner.currentPluginHooks

    return pluginHooks ? this.buildActions(pluginHooks.calendarActions) : this.coreActions
  }
  private state: CalendarDataManagerState // internal state
  private data: CalendarData // internal state + computed

  // used by CalendarApiImpl
  public emitter = new Emitter<Required<CalendarListeners>>()
  private optionsRefiner = new OptionsRefinerCache()

  get currentCalendarOptionsRefiners() {
    return this.optionsRefiner.currentCalendarOptionsRefiners
  }

  get currentCalendarOptionsInput(): CalendarOptions {
    return this.optionsRefiner.currentCalendarOptionsInput
  }

  constructor(config: CalendarStoreConfig) {
    this.config = config
    config.calendarApi.store = this
    this.coreActions = createCalendarActions(this, config.calendarApi)
    this.nowManager = new CalendarNowManager()
    this.nowTimer = new NowTimerRunner(this.handleNowChange)
  }

  /*
  Starts timers, runs effects queued by render-time updates, and delivers data changes held while
  not mounted. Idempotent. Called again after unmount() for remounts (Strict Mode, <Activity>,
  rendering after destroy())
  */
  mount() {
    if (!this.isMounted) {
      this.isMounted = true
      this.isInCommit = true // before anything that might drain, like the timer catching up
      this.nowTimer.start()
      // binds initially (vanilla), or rebinds after unmount() unless another calendar took it
      this.syncController(
        this.config.isMountGated ? this.committedController : this.data.calendarOptions.controller,
      )

      this.flushEffects()

      const { pendingActions } = this
      if (pendingActions.length) {
        this.pendingActions = []
        this.notify(pendingActions, true)
      }
      this.isInCommit = false
    }
  }

  unmount() {
    if (this.isMounted) {
      this.isMounted = false
      this.nowTimer.stop()
    }

    if (this.committedController) {
      this.committedController._unsetApi(this.config.calendarApi)
      this.isControllerDetached = true
    }
  }

  destroy() {
    this.unmount()
  }

  /*
  Will NOT notify subscribers unless there were other actions in the queue.
  With isRendering, called during a render: effects wait for flushEffects(), and subscribers aren't
  called, because the render uses the returned data
  */
  update(optionOverrides: CalendarOptions, isRendering = false): CalendarData {
    this.optionOverrides = optionOverrides
    this.actionQueue.push({ type: 'IDLE' }) // ensure reducer gets called
    this.drainActionQueue(isRendering)

    return this.data
  }

  // runs effects queued by render-time updates. call after each commit
  flushEffects() {
    if (this.effectQueue.length && !this.isDrainingActionQueue) {
      const wasInCommit = this.isInCommit
      this.isInCommit = true
      this.drainActionQueue()
      this.isInCommit = wasInCommit
    }
  }

  /*
  Binds the given controller, unbinding the previous one. Called with committed data: by CalendarInner
  after each commit, before it emits datesSet, and after each reduction when not mount-gated (vanilla)
  */
  syncController = (controller: CalendarController | undefined) => {
    const { calendarApi } = this.config

    if (controller !== this.committedController) {
      this.committedController?._unsetApi(calendarApi) // only if still bound to this calendar
      this.committedController = controller
      this.isControllerDetached = false
      controller?._setApi(calendarApi)
    } else if (this.isControllerDetached) {
      // after unmount(), only take it back if no other calendar has
      this.isControllerDetached = false
      controller?._restoreApi(calendarApi)
    }
  }

  private queueEffect(effect: () => void) {
    this.effectQueue.push(effect)
  }

  /*
  WILL notify subscribers
  */
  resetOptions(optionOverrides: CalendarOptions, changedOptionNames?: string[]) {
    if (changedOptionNames === undefined) {
      this.optionOverrides = optionOverrides
    } else {
      this.optionOverrides = { ...this.optionOverrides, ...optionOverrides }
      this.optionsRefiner.invalidate(changedOptionNames)
    }

    this.dispatch({ type: 'RESET_OPTIONS' })
  }

  // subscribers are called once per drain that completed actions, after it settles. not on
  // initialization, idle-only drains or render-time drains, and, mount-gated, only while mounted
  subscribe(listener: CalendarStoreListener): () => void {
    this.listeners.push(listener)

    return () => {
      this.listeners = this.listeners.filter((otherListener) => otherListener !== listener)
    }
  }

  getState(): CalendarDataManagerState {
    return this.state
  }

  getData(): CalendarData {
    return this.data
  }

  getCurrentData = () => this.data

  private handleNowChange = () => {
    this.dispatch({ type: 'UPDATE_NOW' })
  }

  dispatch = (action: Action) => {
    this.actionQueue.push(action)

    if (!this.isDrainingActionQueue) {
      this.drainActionQueue()
    }
  }

  private drainActionQueue(isRendering = false) {
    let { state, data } = this
    const isInit = !state

    const { actionQueue } = this
    const actionsComplete: Action[] = [] // non-idle

    this.isDrainingActionQueue = true

    // a mount-gated calendar holds effects while not mounted, e.g. ones a render that never committed
    // queued, until a later fetch drains here
    const canRunEffects = !isRendering && (this.isMounted || !this.config.isMountGated)

    // effects run after the reduction that queued them, and may dispatch more actions
    while (actionQueue.length || (canRunEffects && this.effectQueue.length)) {
      if (actionQueue.length) {
        const action = actionQueue.shift()

        ;({ state, data } = this.reduce(state, data, action))
        this.state = state
        this.data = data

        // outside React, the reduced data is what renders. React's CalendarInner syncs on commit
        if (!this.config.isMountGated && this.isMounted) {
          this.syncController(data.calendarOptions.controller)
        }

        if (action.type !== 'IDLE') {
          actionsComplete.push(action)
        }
      } else {
        const effects = this.effectQueue
        this.effectQueue = []

        for (const effect of effects) {
          effect()
        }
      }
    }

    this.isDrainingActionQueue = false

    if (!isInit && !isRendering && actionsComplete.length) {
      this.deliverDataChange(actionsComplete)
    }
  }

  private deliverDataChange(actionsComplete: Action[]) {
    if (this.config.isMountGated && !this.isMounted) {
      this.pendingActions.push(...actionsComplete)
    } else {
      this.notify(actionsComplete, this.isInCommit)
    }
  }

  private notify(completedActions: Action[], isInCommit: boolean) {
    const change: CalendarStoreChange = {
      completedActions,
      isUrgent: computeIsUrgent(completedActions),
      isInCommit,
    }

    for (const listener of this.listeners) {
      listener(change)
    }
  }

  /*
  One action through the pipeline's stages, in their dependency order, which is also the order of their
  side effects. Between stages are checkpoints, where those side effects run, at the same points as
  before the split. API reads see the previous data until this returns and the drain installs the new.
  See planning/phase-9-store.md (the staged pipeline)
  */
  private reduce(
    prevState: CalendarDataManagerState | undefined,
    prevData: CalendarData | undefined,
    action: Action,
  ): { state: CalendarDataManagerState; data: CalendarData; calendarContext: CalendarContext } {
    // a refresh probed a profile that another action (one the validRange function dispatched, say)
    // has replaced since: its probe is stale, and the new profile was built with the current inputs
    if (action.type === 'REFRESH_DATE_PROFILE' && (!prevState || prevState.dateProfile !== action.probedDateProfile)) {
      action = { type: 'IDLE' }
    }

    // 1. options
    let { dynamicOptionOverrides, optionsData } = this.reduceOptions(prevState, action)

    // 2. view type and view data (refines the view's options, then gives `now` to the now manager)
    let currentViewType = prevState
      ? reduceViewType(prevState.currentViewType, action)
      : (optionsData.calendarOptions.initialView || optionsData.pluginHooks.initialView)
    let currentViewData = this.computeCurrentViewData(
      currentViewType,
      optionsData,
      this.optionOverrides,
      dynamicOptionOverrides,
    )

    // checkpoint: the emitter calls the view's handlers from here on
    this.emitter.setThisContext(this.config.calendarApi)
    this.emitter.setOptions(currentViewData.options)

    let calendarContext = this.buildCalendarContext(optionsData)
    let effects = this.buildReduceEffects(optionsData)

    // 3. now (the timer re-arms itself if its inputs changed)
    let nowDate = this.reduceNowDate(optionsData)

    // 4. current date, date profile
    let { currentDate, dateProfile } = this.reduceDates(
      prevState, prevData, action, optionsData, currentViewData, nowDate,
    )

    // 5. event sources (checkpoints: each dirty source's fetch, through the effects)
    // 6. event stores
    let { eventSources, eventStore, renderableEventStore } = this.reduceEvents(
      prevState, action, optionsData, currentViewData, dateProfile, calendarContext, effects,
    )

    // 7. derived: UI bases, business hours. selection, drag, resize
    let { newState, derived } = this.reduceUiAndSelection(
      prevState, action, calendarContext, {
        dynamicOptionOverrides,
        currentViewType,
        currentDate,
        dateProfile,
        eventSources,
        eventStore,
        renderableEventStore,
        nowDate,
      },
    )

    // 8. plugin slices
    this.reducePluginSlices(prevState, action, optionsData, calendarContext, effects, newState, derived)

    // 9. loading transition (checkpoint: queues the deferred `loading` callback)
    this.captureLoading(prevState, newState, calendarContext)

    // 10. CalendarData
    let newData = this.buildData(optionsData, currentViewData, derived, newState, currentDate, dateProfile, nowDate)

    // 11. late stage: time zone change, option change handlers (checkpoint: runs the handlers)
    this.reduceLate(prevData, optionsData, dateProfile, newState, newData, effects)

    return { state: newState, data: newData, calendarContext }
  }

  private reduceOptions(prevState: CalendarDataManagerState | undefined, action: Action) {
    let dynamicOptionOverrides = prevState
      ? reduceDynamicOptionOverrides(prevState.dynamicOptionOverrides, action)
      : {}

    let optionsData = this.optionsRefiner.computeOptionsData(
      this.optionOverrides,
      dynamicOptionOverrides,
      this.config.calendarApi,
    )

    return { dynamicOptionOverrides, optionsData }
  }

  private buildCalendarContext(optionsData: CalendarOptionsData): CalendarContext {
    return {
      nowManager: this.nowManager,
      dateEnv: optionsData.dateEnv,
      options: optionsData.calendarOptions,
      pluginHooks: optionsData.pluginHooks,
      calendarApi: this.config.calendarApi,
      dispatch: this.dispatch,
      emitter: this.emitter,
      getCurrentData: this.getCurrentData,
    }
  }

  // the reducers describe their side effects (fetches); runners perform them, at the point the reducer
  // asks, so the order is today's. the core's are defaults, which plugins may replace
  private buildReduceEffects(optionsData: CalendarOptionsData): ReduceEffects {
    return createReduceEffects({
      ...CORE_EFFECT_RUNNERS,
      ...optionsData.pluginHooks.effectRunners,
    })
  }

  private reduceNowDate(optionsData: CalendarOptionsData): DateMarker {
    return this.nowTimer.update({
      unit: 'day',
      unitValue: 1,
      nowIndicatorSnap: 'auto',
      nowManager: this.nowManager,
      dateEnv: optionsData.dateEnv,
    }).nowDate
  }

  private reduceDates(
    prevState: CalendarDataManagerState | undefined,
    prevData: CalendarData | undefined,
    action: Action,
    optionsData: CalendarOptionsData,
    currentViewData: CalendarCurrentViewData,
    nowDate: DateMarker,
  ) {
    let currentDate = prevState
      ? reduceCurrentDate(prevState.currentDate, action)
      : getInitialDate(optionsData.calendarOptions, optionsData.dateEnv, this.nowManager)

    let dateProfile: DateProfile
    if (!prevState) {
      dateProfile = currentViewData.dateProfileGenerator.build(currentDate, nowDate)
    } else {
      dateProfile = prevState.dateProfile
      // Check for generator change
      if (prevData && prevData.dateProfileGenerator !== currentViewData.dateProfileGenerator) {
        dateProfile = currentViewData.dateProfileGenerator.build(currentDate, nowDate)
      }
      dateProfile = reduceDateProfile(dateProfile, action, currentDate, nowDate, currentViewData.dateProfileGenerator)

      // a new day, and nothing rebuilt the profile: a now-dependent validRange may have moved
      if (dateProfile === prevState.dateProfile && nowDate.valueOf() !== prevState.nowDate.valueOf()) {
        this.probeNewDayValidRange(dateProfile, currentViewData.dateProfileGenerator, nowDate)
      }
    }

    // Adjust currentDate if out of range
    if (
      (action && (action.type === 'PREV' || action.type === 'NEXT')) ||
      !rangeContainsMarker(dateProfile.activeRange, currentDate)
    ) {
      currentDate = dateProfile.currentRange.start
    }

    return { currentDate, dateProfile }
  }

  /*
  Calls only the validRange function (once), and only if the range changed by value, rebuilds the profile
  as it was built (reusing this result instead of calling the function again) and installs it through
  REFRESH_DATE_PROFILE: then the events and datesSet follow, as for navigation. A rebuilt profile with no
  valid date (no active range) isn't installed: the views can't render one (the same TypeError as creating
  the calendar that day), so the old profile stays, as before this. Built-in generators only: a custom class
  has no rebuild protocol yet. See planning/phase-10-date-profile.md §4
  */
  private probeNewDayValidRange(dateProfile: DateProfile, generator: DateProfileGenerator, nowDate: DateMarker) {
    let { props } = generator

    if (
      !props.dateProfileGeneratorClass &&
      typeof props.validRangeInput === 'function' &&
      getDateProfileAnchor(dateProfile)
    ) {
      let untrimmedValidRange = generator.buildValidRange(nowDate)

      if (!isOpenRangeEqual(generator.trimHiddenDays(untrimmedValidRange), dateProfile.validRange)) {
        let anchor = getDateProfileAnchor(dateProfile)
        let refreshed = generator.build(
          anchor.date,
          nowDate,
          anchor.direction,
          anchor.forceToValid,
          untrimmedValidRange,
        )

        if (refreshed.activeRange) {
          this.dispatch({ type: 'REFRESH_DATE_PROFILE', dateProfile: refreshed, probedDateProfile: dateProfile })
        }
      }
    }
  }

  private reduceEvents(
    prevState: CalendarDataManagerState | undefined,
    action: Action,
    optionsData: CalendarOptionsData,
    currentViewData: CalendarCurrentViewData,
    dateProfile: DateProfile,
    calendarContext: CalendarContext,
    effects: ReduceEffects,
  ) {
    let eventSources = prevState
      ? reduceEventSources(prevState.eventSources, action, dateProfile, calendarContext, effects)
      : initEventSources(optionsData.calendarOptions, dateProfile, calendarContext, effects)

    let eventStore = prevState
      ? reduceEventStore(prevState.eventStore, action, eventSources, dateProfile, calendarContext)
      : createEmptyEventStore()

    let isEventsLoading = computeEventSourcesLoading(eventSources)
    // initially the same empty store, which the next reduction keeps instead of swapping in an equal one
    let renderableEventStore = !prevState
      ? eventStore
      : (isEventsLoading && !currentViewData.options.progressiveEventRendering)
        ? (prevState.renderableEventStore || eventStore)
        : eventStore

    return { eventSources, eventStore, renderableEventStore }
  }

  private reduceUiAndSelection(
    prevState: CalendarDataManagerState | undefined,
    action: Action,
    calendarContext: CalendarContext,
    reduced: Pick<CalendarDataManagerState,
      'dynamicOptionOverrides' | 'currentViewType' | 'currentDate' | 'dateProfile' |
      'eventSources' | 'eventStore' | 'renderableEventStore' | 'nowDate'>,
  ): { newState: CalendarDataManagerState, derived: CalendarDerivedData } {
    // derived (memoized), in the order they were computed when they were state
    let { eventUiSingleBase, selectionConfig } = this.buildViewUiProps(calendarContext)
    let eventUiBySource = this.buildEventUiBySource(reduced.eventSources)
    // initially too, so the next reduction gets the same object back from the memo
    let eventUiBases = this.buildEventUiBases(reduced.renderableEventStore.defs, eventUiSingleBase, eventUiBySource)
    let derived: CalendarDerivedData = {
      selectionConfig,
      eventUiBases,
      businessHours: this.parseContextBusinessHours(calendarContext),
    }

    let newState: CalendarDataManagerState = {
      dynamicOptionOverrides: reduced.dynamicOptionOverrides,
      currentViewType: reduced.currentViewType,
      currentDate: reduced.currentDate,
      dateProfile: reduced.dateProfile,
      eventSources: reduced.eventSources,
      eventStore: reduced.eventStore,
      renderableEventStore: reduced.renderableEventStore,
      dateSelection: prevState ? reduceDateSelection(prevState.dateSelection, action) : null,
      eventSelection: prevState ? reduceSelectedEvent(prevState.eventSelection, action) : '',
      eventDrag: prevState ? reduceEventDrag(prevState.eventDrag, action) : null,
      eventResize: prevState ? reduceEventResize(prevState.eventResize, action) : null,
      nowDate: reduced.nowDate,
    }

    return { newState, derived }
  }

  // each plugin reducer gets the same snapshot, taken before the first, and its result is merged in
  private reducePluginSlices(
    prevState: CalendarDataManagerState | undefined,
    action: Action,
    optionsData: CalendarOptionsData,
    calendarContext: CalendarContext,
    effects: ReduceEffects,
    newState: CalendarDataManagerState,
    derived: CalendarDerivedData,
  ) {
    let contextAndState = { ...calendarContext, ...derived, ...newState }
    for (let reducer of optionsData.pluginHooks.reducers) {
      Object.assign(newState, reducer(prevState, action, contextAndState, effects))
    }
  }

  // per action, comparing this action's input and output (not settled snapshots)
  private captureLoading(
    prevState: CalendarDataManagerState | undefined,
    newState: CalendarDataManagerState,
    calendarContext: CalendarContext,
  ) {
    let wasLoading = prevState ? computeIsLoading(prevState, calendarContext) : false
    let isLoading = computeIsLoading(newState, calendarContext)

    if (wasLoading !== isLoading) {
      this.queueEffect(() => this.emitter.trigger('loading', isLoading))
    }
  }

  private buildData(
    optionsData: CalendarOptionsData,
    currentViewData: CalendarCurrentViewData,
    derived: CalendarDerivedData,
    newState: CalendarDataManagerState,
    currentDate: DateMarker, // the core's, even if a plugin slice returned its own
    dateProfile: DateProfile,
    nowDate: DateMarker,
  ): CalendarData {
    let viewTitle = this.buildTitle(dateProfile, currentViewData.options, optionsData.dateEnv)

    let toolbarProps = this.buildToolbarProps(
      currentViewData.viewSpec,
      dateProfile,
      currentViewData.dateProfileGenerator,
      currentDate,
      nowDate,
      viewTitle,
    )

    return {
      viewTitle,
      nowManager: this.nowManager,
      calendarApi: this.config.calendarApi,
      dispatch: this.dispatch,
      syncController: this.syncController,
      emitter: this.emitter,
      getCurrentData: this.getCurrentData,
      toolbarProps,
      ...optionsData,
      ...currentViewData,
      ...derived, // before the slices, which a plugin slice's same-named key overrode when these were state
      ...newState,
    }
  }

  /*
  After the data is built: a time zone change refetches (per source, as in stage 5) and rezones both
  stores, writing into the new state and data, then the option change handlers run with the new data
  (getCurrentData() still returns the previous)
  */
  private reduceLate(
    prevData: CalendarData | undefined,
    optionsData: CalendarOptionsData,
    dateProfile: DateProfile,
    newState: CalendarDataManagerState,
    newData: CalendarData,
    effects: ReduceEffects,
  ) {
    let changeHandlers = optionsData.pluginHooks.optionChangeHandlers
    let optionsForHandling = this.optionsRefiner.takeOptionsForHandling()
    let prevCalendarOptions = prevData && prevData.calendarOptions
    let newCalendarOptions = optionsData.calendarOptions

    if (prevCalendarOptions && prevCalendarOptions !== newCalendarOptions) {
      if (prevCalendarOptions.timeZone !== newCalendarOptions.timeZone) {
        // HACK
        newState.eventSources = newData.eventSources = reduceEventSourcesNewTimeZone(newData.eventSources, dateProfile, newData, effects)
        newState.eventStore = newData.eventStore = rezoneEventStoreDates(newData.eventStore, prevData!.dateEnv, newData.dateEnv)
        newState.renderableEventStore = newData.renderableEventStore = rezoneEventStoreDates(newData.renderableEventStore, prevData!.dateEnv, newData.dateEnv)
      }

      for (let optionName in changeHandlers) {
        if (
          optionsForHandling.indexOf(optionName) !== -1 ||
          prevCalendarOptions[optionName] !== newCalendarOptions[optionName]
        ) {
          effects.run({
            type: 'optionChange',
            optionName,
            optionValue: newCalendarOptions[optionName],
            data: newData,
          } as OptionChangeEffect)
        }
      }
    }
  }

  private _computeCurrentViewData(
    viewType: string,
    optionsData: CalendarOptionsData,
    optionOverrides: CalendarOptions,
    dynamicOptionOverrides: CalendarOptions,
  ): CalendarCurrentViewData {
    let viewSpec = optionsData.viewSpecs[viewType]

    if (!viewSpec) {
      throw new Error(`viewType "${viewType}" is not available. Please make sure you've loaded all neccessary plugins`)
    }

    let { refinedOptions } = this.optionsRefiner.processRawViewOptions(
      viewSpec,
      optionsData.pluginHooks,
      optionsData.localeDefaults,
      optionOverrides,
      dynamicOptionOverrides,
    )

    this.nowManager.handleInput(optionsData.dateEnv, refinedOptions.now)

    let generatorProps: DateProfileGeneratorProps = {
      dateProfileGeneratorClass: viewSpec.optionDefaults.dateProfileGeneratorClass as any,
      duration: viewSpec.duration,
      durationUnit: viewSpec.durationUnit,
      usesMinMaxTime: viewSpec.optionDefaults.usesMinMaxTime as any,
      dateEnv: optionsData.dateEnv,
      calendarApi: this.config.calendarApi,
      slotMinTime: refinedOptions.slotMinTime,
      slotMaxTime: refinedOptions.slotMaxTime,
      showNonCurrentDates: refinedOptions.showNonCurrentDates,
      dayCount: refinedOptions.dayCount,
      dateAlignment: refinedOptions.dateAlignment,
      dateIncrement: refinedOptions.dateIncrement,
      hiddenDays: refinedOptions.hiddenDays,
      weekends: refinedOptions.weekends,
      validRangeInput: refinedOptions.validRange,
      visibleRangeInput: refinedOptions.visibleRange,
      fixedWeekCount: refinedOptions.fixedWeekCount,
    }

    // the view's render range (the table views'), for the base class only: a custom class keeps today's
    // props exactly (no new key), which are also the memo key
    let renderRange = viewSpec.optionDefaults.dateProfileRenderRange as RenderRangeBuilder | undefined
    if (renderRange && !generatorProps.dateProfileGeneratorClass) {
      generatorProps.renderRange = renderRange
    }

    let dateProfileGenerator = this.buildDateProfileGenerator(generatorProps)

    let viewApi = this.buildViewApi(viewType, this.getCurrentData, optionsData.dateEnv)

    return { viewSpec, options: refinedOptions, dateProfileGenerator, viewApi }
  }
}

// open ranges (null for an open end), by value
function isOpenRangeEqual(range0: OpenDateRange | null, range1: OpenDateRange | null): boolean {
  if (!range0 || !range1) {
    return range0 === range1
  }

  return markerValue(range0.start) === markerValue(range1.start) &&
    markerValue(range0.end) === markerValue(range1.end)
}

function markerValue(marker: DateMarker | null | undefined): number | null {
  return marker ? marker.valueOf() : null
}

function buildDateProfileGenerator(props: DateProfileGeneratorProps): DateProfileGenerator {
  let DateProfileGeneratorClass = props.dateProfileGeneratorClass || DateProfileGenerator

  return new DateProfileGeneratorClass(props)
}

function buildViewApi(type: string, getCurrentData: () => CalendarData, dateEnv: DateEnv) {
  return new ViewImpl(type, getCurrentData, dateEnv)
}

function buildEventUiBySource(eventSources: EventSourceHash): EventUiHash {
  return mapHash(eventSources, (eventSource) => eventSource.ui)
}

/*
The result of this is processed by compileEventUi
*/
function buildEventUiBases(
  eventDefs: EventDefHash,
  eventUiSingleBase: EventUi,
  eventUiBySource: EventUiHash,
) {
  let eventUiBases: EventUiHash = {
    '': eventUiSingleBase, // fallback
  }

  for (let defId in eventDefs) {
    let def = eventDefs[defId]

    if (def.sourceId && eventUiBySource[def.sourceId]) {
      eventUiBases[defId] = eventUiBySource[def.sourceId]
    }
  }

  return eventUiBases
}

function buildViewUiProps(calendarContext: CalendarContext) {
  const { options } = calendarContext

  return {
    eventUiSingleBase: createEventUi(
      {
        display: options.eventDisplay,
        editable: options.editable, // without "event" at start
        startEditable: options.eventStartEditable,
        durationEditable: options.eventDurationEditable,
        constraint: options.eventConstraint,
        overlap: typeof options.eventOverlap === 'boolean' ? options.eventOverlap : undefined,
        allow: options.eventAllow,
        // color: options.eventColor, // event components/BgEvent will handle this
        // contrastColor: options.eventContrastColor, // event components/BgEvent will handle this
        // className: options.eventClass // render hook will handle this
      },
      calendarContext,
    ),
    selectionConfig: createEventUi(
      {
        constraint: options.selectConstraint,
        overlap: typeof options.selectOverlap === 'boolean' ? options.selectOverlap : undefined,
        allow: options.selectAllow,
      },
      calendarContext,
    ),
  }
}

// drags and resizes render synchronously, without rerenderDelay
function computeIsUrgent(actions: Action[]): boolean {
  for (const action of actions) {
    if (
      action.type === 'SET_EVENT_DRAG' ||
      action.type === 'UNSET_EVENT_DRAG' ||
      action.type === 'SET_EVENT_RESIZE' ||
      action.type === 'UNSET_EVENT_RESIZE' ||
      // could happen as a result of a drag or resize and must be part of same sync pipeline
      action.type === 'MERGE_EVENTS'
    ) {
      return true
    }
  }
  return false
}

function computeIsLoading(state: CalendarDataManagerState, context: CalendarContext) {
  for (let isLoadingFunc of context.pluginHooks.isLoadingFuncs) {
    if (isLoadingFunc(state)) {
      return true
    }
  }

  return false
}

function parseContextBusinessHours(calendarContext: CalendarContext) {
  return parseBusinessHours(calendarContext.options.businessHours, calendarContext)
}

export interface CalendarToolbarProps {
  title: string
  selectedButton: string
  navUnit: string
  isTodayEnabled: boolean
  isPrevEnabled: boolean
  isNextEnabled: boolean
}

function buildToolbarProps(
  viewSpec: ViewSpec,
  dateProfile: DateProfile,
  dateProfileGenerator: DateProfileGenerator,
  currentDate: DateMarker,
  nowDate: DateMarker,
  title: string,
): CalendarToolbarProps {
  // don't force any date-profiles to valid date profiles (the `false`) so that we can tell if it's invalid
  let todayInfo = dateProfileGenerator.build(nowDate, nowDate, undefined, /* forceToValid = */ false)
  let prevInfo = dateProfileGenerator.buildPrev(dateProfile, currentDate, nowDate, /* forceToValid = */ false)
  let nextInfo = dateProfileGenerator.buildNext(dateProfile, currentDate, nowDate, /* forceToValid = */ false)

  return {
    title,
    selectedButton: viewSpec.type,
    navUnit: viewSpec.singleUnit,
    isTodayEnabled: todayInfo.isValid && !rangeContainsMarker(dateProfile.currentRange, nowDate),
    isPrevEnabled: prevInfo.isValid,
    isNextEnabled: nextInfo.isValid,
  }
}
