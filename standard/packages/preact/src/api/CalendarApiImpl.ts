import { FormatterInput, createFormatter } from '../datelib/formatting'
import { joinDateTimeFormatParts } from '@full-ui/headless-calendar'
import { PointerDragEvent } from '../interactions/pointer-types'
import type { CalendarStore } from '../store/CalendarStore'
import { Action } from '../store/actions'
import { buildEventApis, EventImpl } from './EventImpl'
import { CalendarData } from '../store/data-types'
import { CalendarApi } from './CalendarApi'
import { ViewImpl } from './ViewImpl'
import { EventSourceImpl } from './EventSourceImpl'
import { warn } from '../util/warn'
import {
  CalendarOptions,
  CalendarListeners,
  DateInput,
  DurationInput,
  DateRangeInput,
  EventSourceInput,
  EventInput,
} from './public-types'
import { NavButtonState, ButtonStateMap } from '../toolbar/button-state'
import { formatWithOrdinals } from '../util/misc'
import { CalendarOptionsRefined } from '../options/options'

export class CalendarApiImpl implements CalendarApi {
  store?: CalendarStore // set by the store, which is created together with this

  getCurrentData(): CalendarData {
    return this.store!.getData()
  }

  dispatch(action: Action): void {
    this.store!.dispatch(action)
  }

  get view(): ViewImpl { return this.getCurrentData().viewApi }

  batchRendering(callback: () => void): void { // subclasses should implement
    callback()
  }

  // Options
  // -----------------------------------------------------------------------------------------------------------------

  setOption<OptionName extends keyof CalendarOptions>(name: OptionName, val: CalendarOptions[OptionName]): void {
    this.store!.actions.setOption(name, val)
  }

  getOption<OptionName extends keyof CalendarOptions>(name: OptionName): CalendarOptions[OptionName] {
    return this.store!.currentCalendarOptionsInput[name]
  }

  getAvailableLocaleCodes(): string[] {
    return Object.keys(this.getCurrentData().availableRawLocales)
  }

  // Trigger
  // -----------------------------------------------------------------------------------------------------------------

  on<ListenerName extends keyof CalendarListeners>(handlerName: ListenerName, handler: Required<CalendarListeners>[ListenerName]): void {
    let { store } = this

    if (store.currentCalendarOptionsRefiners[handlerName]) {
      store.emitter.on(handlerName, handler)
    } else {
      warn(`Unknown listener \`${handlerName}\`.`)
    }
  }

  off<ListenerName extends keyof CalendarListeners>(handlerName: ListenerName, handler: Required<CalendarListeners>[ListenerName]): void {
    this.store!.emitter.off(handlerName, handler)
  }

  // not meant for public use
  trigger<ListenerName extends keyof CalendarListeners>(handlerName: ListenerName, ...args: Parameters<Required<CalendarListeners>[ListenerName]>): void {
    this.store!.emitter.trigger(handlerName, ...args)
  }

  // View
  // -----------------------------------------------------------------------------------------------------------------

  changeView(viewType: string, dateOrRange?: DateRangeInput | DateInput): void {
    this.store!.actions.changeView(viewType, dateOrRange)
  }

  // Forces navigation to a view for the given date.
  // `viewType` can be a specific view name or a generic one like "week" or "day".
  zoomTo(dateMarker: Date, viewType?: string): void {
    this.store!.actions.zoomTo(dateMarker, viewType)
  }

  // Current Date
  // -----------------------------------------------------------------------------------------------------------------

  prev(): void {
    this.store!.actions.prev()
  }

  next(): void {
    this.store!.actions.next()
  }

  prevYear(): void {
    this.store!.actions.prevYear()
  }

  nextYear(): void {
    this.store!.actions.nextYear()
  }

  today(): void {
    this.store!.actions.today()
  }

  gotoDate(zonedDateInput: DateInput): void {
    this.store!.actions.gotoDate(zonedDateInput)
  }

  incrementDate(deltaInput: DurationInput): void {
    this.store!.actions.incrementDate(deltaInput)
  }

  getDate(): Date {
    let state = this.getCurrentData()
    return state.dateEnv.toDate(state.currentDate)
  }

  // Date Formatting Utils
  // -----------------------------------------------------------------------------------------------------------------

  formatDate(d: DateInput, formatter: FormatterInput): string {
    let { dateEnv } = this.getCurrentData()
    let dateMeta = dateEnv.createMarkerMeta(d)

    return joinDateTimeFormatParts(
      dateEnv.formatToParts(
        dateMeta.marker,
        createFormatter(formatter),
        { instantMs: dateMeta.instantMs },
      ),
    )
  }

  // `settings` is for formatter AND isEndExclusive
  formatRange(d0: DateInput, d1: DateInput, settings: any): string { // TODO: settings type
    let { dateEnv } = this.getCurrentData()
    let startMeta = dateEnv.createMarkerMeta(d0)
    let endMeta = dateEnv.createMarkerMeta(d1)

    return joinDateTimeFormatParts(
      dateEnv.formatRangeToParts(
        startMeta.marker,
        endMeta.marker,
        createFormatter(settings),
        {
          isEndExclusive: settings.isEndExclusive,
          startInstantMs: startMeta.instantMs,
          endInstantMs: endMeta.instantMs,
        },
      ),
    )
  }

  formatIso(d: DateInput, omitTime?: boolean): string {
    let { dateEnv } = this.getCurrentData()

    return dateEnv.formatIso(dateEnv.createMarker(d), { omitTime })
  }

  // Date Selection / Event Selection / DayClick
  // -----------------------------------------------------------------------------------------------------------------

  select(dateOrObj: DateInput | any, endDate?: DateInput): void {
    this.store!.actions.select(dateOrObj, endDate)
  }

  unselect(pev?: PointerDragEvent): void {
    this.store!.actions.unselect(pev)
  }

  // Public Events API
  // -----------------------------------------------------------------------------------------------------------------

  addEvent(eventInput: EventInput, sourceInput?: EventSourceImpl | string | boolean): EventImpl | null {
    return this.store!.actions.addEvent(eventInput, sourceInput)
  }

  // TODO: optimize
  getEventById(id: string): EventImpl | null {
    let state = this.getCurrentData()
    let { defs, instances } = state.eventStore
    id = String(id)

    for (let defId in defs) {
      let def = defs[defId]

      if (def.publicId === id) {
        if (def.recurringDef) {
          return new EventImpl(state, def, null)
        }

        for (let instanceId in instances) {
          let instance = instances[instanceId]

          if (instance.defId === def.defId) {
            return new EventImpl(state, def, instance)
          }
        }
      }
    }

    return null
  }

  getEvents(): EventImpl[] {
    let currentData = this.getCurrentData()

    return buildEventApis(currentData.eventStore, currentData)
  }

  removeAllEvents(): void {
    this.store!.actions.removeAllEvents()
  }

  // Public Event Sources API
  // -----------------------------------------------------------------------------------------------------------------

  getEventSources(): EventSourceImpl[] {
    let state = this.getCurrentData()
    let sourceHash = state.eventSources
    let sourceApis: EventSourceImpl[] = []

    for (let internalId in sourceHash) {
      sourceApis.push(new EventSourceImpl(state, sourceHash[internalId]))
    }

    return sourceApis
  }

  getEventSourceById(id: string): EventSourceImpl | null {
    let state = this.getCurrentData()
    let sourceHash = state.eventSources
    id = String(id)

    for (let sourceId in sourceHash) {
      if (sourceHash[sourceId].publicId === id) {
        return new EventSourceImpl(state, sourceHash[sourceId])
      }
    }

    return null
  }

  addEventSource(sourceInput: EventSourceInput): EventSourceImpl {
    return this.store!.actions.addEventSource(sourceInput)
  }

  removeAllEventSources(): void {
    this.store!.actions.removeAllEventSources()
  }

  refetchEvents(): void {
    this.store!.actions.refetchEvents()
  }

  // Scroll
  // -----------------------------------------------------------------------------------------------------------------

  scrollToTime(timeInput: DurationInput): void {
    this.store!.actions.scrollToTime(timeInput)
  }

  // Button State
  // -----------------------------------------------------------------------------------------------------------------

  getButtonState(): ButtonStateMap {
    const currentData = this.getCurrentData()
    const { toolbarProps } = currentData

    const options = currentData.calendarOptions
    const buttonConfigs = options.buttons || {}
    const viewSpecs = currentData.viewSpecs

    const currentUnit = currentData.viewSpec.singleUnit
    const currentHintOrdinal = [
      currentUnit ? getSingleUnitText(currentUnit, options) : '',
      currentUnit,
    ]

    const buttonState: ButtonStateMap = {
      today: {
        text: options.todayText,
        hint: formatWithOrdinals(options.todayHint, currentHintOrdinal, options.todayText),
        isDisabled: !toolbarProps.isTodayEnabled,
      } as NavButtonState,

      prev: {
        text: options.prevText,
        hint: formatWithOrdinals(options.prevHint, currentHintOrdinal, options.prevText),
        isDisabled: !toolbarProps.isPrevEnabled,
      } as NavButtonState,

      next: {
        text: options.nextText,
        hint: formatWithOrdinals(options.nextHint, currentHintOrdinal, options.nextText),
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
      const { singleUnit } = viewSpec
      const buttonTextKey = viewSpec.optionDefaults.buttonTextKey

      const buttonText =
        buttonConfigs[viewSpecName]?.text ||
        (buttonTextKey ? options[buttonTextKey] : '') ||
        (singleUnit ? getSingleUnitText(singleUnit, options) : '') ||
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
}

function getSingleUnitText(singleUnit: string, options: CalendarOptionsRefined): string {
  return options[singleUnit + 'TextLong'] || options[singleUnit + 'Text']
}
