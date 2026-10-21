import { buildLocale, RawLocaleInfo, organizeRawLocales, LocaleSingularArg } from '../datelib/locale'
import { memoize } from '../util/memoize'
import { buildBuildPluginHooks } from '../plugins/plugin-system'
import { PluginHooks } from '../plugins/plugin-types'
import { DateEnv } from '@full-ui/headless-calendar'
import { CalendarApiImpl } from '../api/CalendarApiImpl'
import { buildViewSpecs, ViewSpec } from '../views/view-spec'
import { parseToolbars } from '../toolbar/parse'
import {
  CalendarOptionsRefined, CalendarOptions,
  CALENDAR_ONLY_OPTION_REFINERS, COMPLEX_OPTION_COMPARATORS,
  ViewOptions, ViewOptionsRefined,
  BASE_OPTION_DEFAULTS,
  BASE_OPTION_REFINERS, VIEW_ONLY_OPTION_REFINERS,
  CALENDAR_LISTENER_REFINERS,
} from './options'
import { isMergedPropsEqual, mergeCalendarOptions, mergeUserOptions } from './merge'
import { globalPlugins } from '../plugins/global-plugins'
import { warn } from '../util/warn'
import { CalendarOptionsData } from '../store/data-types'

/*
The options stage's memo: refines only the options whose raw value changed, so refined objects keep
their identity (render-hook counts depend on it). Owned by one calendar's data manager.
`invalidate(names)` makes the named options refine again, and their change handlers run, even when
their raw values are the same objects (`resetOptions(options, names)`, Vue's nested mutation).
See planning/phase-9-store.md
*/
export class OptionsRefinerCache {
  private organizeRawLocales = memoize(organizeRawLocales)
  private buildLocale = memoize(buildLocale)
  private buildPluginHooks = buildBuildPluginHooks()
  private buildDateEnv = memoize(buildDateEnv)
  private parseToolbars = memoize(parseToolbars)
  private buildViewSpecs = memoize(buildViewSpecs)

  // the last refinement's raw input and refiners. the API reads them (getOption, on), mid-dispatch too
  public currentCalendarOptionsRefiners: any = {}
  public currentCalendarOptionsInput: CalendarOptions = {}

  private currentCalendarOptionsRefined: CalendarOptionsRefined = ({} as any)
  private currentViewOptionsInput: ViewOptions = {}
  private currentViewOptionsRefined: ViewOptionsRefined = ({} as any)

  private stableOptionOverrides: CalendarOptions
  private stableDynamicOptionOverrides: CalendarOptions
  private stableCalendarOptionsData: CalendarOptionsData
  private optionsForRefining: string[] = []
  private optionsForHandling: string[] = []

  // the latest refinement's plugin hooks, from the moment they're built, so its option refiners already
  // see them. undefined before the first
  public currentPluginHooks: PluginHooks | undefined

  // at call time, as resetOptions always has
  invalidate(optionNames: string[]) {
    this.optionsForRefining.push(...optionNames)
  }

  // the options whose change handlers must run even if unchanged. clears them
  takeOptionsForHandling(): string[] {
    const optionNames = this.optionsForHandling
    this.optionsForHandling = []
    return optionNames
  }

  computeOptionsData(
    optionOverrides: CalendarOptions,
    dynamicOptionOverrides: CalendarOptions,
    calendarApi: CalendarApiImpl,
  ): CalendarOptionsData {
    // TODO: blacklist options that are handled by optionChangeHandlers

    if (
      !this.optionsForRefining.length &&
      optionOverrides === this.stableOptionOverrides &&
      dynamicOptionOverrides === this.stableDynamicOptionOverrides
    ) {
      return this.stableCalendarOptionsData
    }

    let {
      refinedOptions, pluginHooks, localeDefaults, availableLocaleData,
    } = this.processRawCalendarOptions(optionOverrides, dynamicOptionOverrides)

    let dateEnv = this.buildDateEnv(
      refinedOptions.timeZone,
      refinedOptions.locale,
      refinedOptions.weekNumberCalculation,
      refinedOptions.firstDay,
      refinedOptions.weekTextLong,
      refinedOptions.weekTextShort,
      pluginHooks,
      availableLocaleData,
    )

    let viewSpecs = this.buildViewSpecs(pluginHooks.views, this.stableOptionOverrides, this.stableDynamicOptionOverrides)
    let toolbarConfig = this.parseToolbars(refinedOptions, viewSpecs, calendarApi)

    return this.stableCalendarOptionsData = {
      calendarOptions: refinedOptions,
      pluginHooks,
      dateEnv,
      viewSpecs,
      toolbarConfig,
      localeDefaults,
      availableRawLocales: availableLocaleData.map,
    }
  }

  // always called from behind a memoizer
  private processRawCalendarOptions(optionOverrides: CalendarOptions, dynamicOptionOverrides: CalendarOptions) {
    let { locales, locale } = mergeCalendarOptions(
      BASE_OPTION_DEFAULTS as any,
      optionOverrides,
      dynamicOptionOverrides,
    )
    let availableLocaleData = this.organizeRawLocales(locales)
    let availableRawLocales = availableLocaleData.map
    let localeDefaults = this.buildLocale(locale || availableLocaleData.defaultCode, availableRawLocales).options
    let pluginHooks = this.currentPluginHooks = this.buildPluginHooks(optionOverrides.plugins || [], globalPlugins)

    let refiners = this.currentCalendarOptionsRefiners = {
      ...BASE_OPTION_REFINERS,
      ...CALENDAR_LISTENER_REFINERS,
      ...CALENDAR_ONLY_OPTION_REFINERS,
      ...pluginHooks.listenerRefiners,
      ...pluginHooks.optionRefiners,
    }
    let raw = mergeCalendarOptions(
      BASE_OPTION_DEFAULTS as any,
      ...pluginHooks.optionDefaults,
      localeDefaults,
      filterKnownOptions(
        mergeUserOptions(
          optionOverrides,
          dynamicOptionOverrides,
        ),
        refiners,
      )
    )

    let refined: Partial<CalendarOptionsRefined> = {}
    let currentRaw = this.currentCalendarOptionsInput
    let currentRefined = this.currentCalendarOptionsRefined
    let anyChanges = false

    for (let optionName in raw) {
      if (
        this.optionsForRefining.indexOf(optionName) === -1 && (
          raw[optionName] === currentRaw[optionName] || (
            COMPLEX_OPTION_COMPARATORS[optionName] &&
            (optionName in currentRaw) &&
            COMPLEX_OPTION_COMPARATORS[optionName](currentRaw[optionName], raw[optionName])
          ) || isMergedPropsEqual(currentRaw[optionName], raw[optionName])
        )
      ) {
        refined[optionName] = currentRefined[optionName]
      } else if (refiners[optionName]) {
        refined[optionName] = refiners[optionName](raw[optionName], optionName)
        anyChanges = true
      }
    }

    if (anyChanges) {
      this.currentCalendarOptionsInput = raw
      this.currentCalendarOptionsRefined = refined as CalendarOptionsRefined

      this.stableOptionOverrides = optionOverrides
      this.stableDynamicOptionOverrides = dynamicOptionOverrides
    }

    this.optionsForHandling.push(...this.optionsForRefining)
    this.optionsForRefining = []

    return {
      rawOptions: this.currentCalendarOptionsInput,
      refinedOptions: this.currentCalendarOptionsRefined,
      pluginHooks,
      availableLocaleData,
      localeDefaults,
    }
  }

  processRawViewOptions(
    viewSpec: ViewSpec,
    pluginHooks: PluginHooks,
    localeDefaults: CalendarOptions,
    optionOverrides: CalendarOptions,
    dynamicOptionOverrides: CalendarOptions,
  ) {
    let refiners = {
      ...BASE_OPTION_REFINERS,
      ...CALENDAR_LISTENER_REFINERS,
      ...CALENDAR_ONLY_OPTION_REFINERS,
      ...VIEW_ONLY_OPTION_REFINERS,
      ...pluginHooks.listenerRefiners,
      ...pluginHooks.optionRefiners,
    }
    let raw = mergeCalendarOptions(
      BASE_OPTION_DEFAULTS as any,
      ...pluginHooks.optionDefaults,
      viewSpec.optionDefaults,
      localeDefaults,
      filterKnownOptions(
        mergeUserOptions(
          optionOverrides,
          viewSpec.optionOverrides,
          dynamicOptionOverrides,
        ),
        refiners,
      ),
    )
    let refined: Partial<ViewOptionsRefined> = {}
    let currentRaw = this.currentViewOptionsInput
    let currentRefined = this.currentViewOptionsRefined
    let anyChanges = false

    for (let optionName in raw) {
      if (
        raw[optionName] === currentRaw[optionName] || (
          COMPLEX_OPTION_COMPARATORS[optionName] &&
          COMPLEX_OPTION_COMPARATORS[optionName](raw[optionName], currentRaw[optionName])
        ) || isMergedPropsEqual(currentRaw[optionName], raw[optionName])
      ) {
        refined[optionName] = currentRefined[optionName]
      } else {
        if (
          raw[optionName] === this.currentCalendarOptionsInput[optionName] ||
          (COMPLEX_OPTION_COMPARATORS[optionName] &&
            COMPLEX_OPTION_COMPARATORS[optionName](raw[optionName], this.currentCalendarOptionsInput[optionName]))
        ) {
          if (optionName in this.currentCalendarOptionsRefined) { // might be an "extra" prop
            refined[optionName] = this.currentCalendarOptionsRefined[optionName]
          }
        } else if (refiners[optionName]) {
          refined[optionName] = refiners[optionName](raw[optionName], optionName)
        }

        anyChanges = true
      }
    }

    if (anyChanges) {
      this.currentViewOptionsInput = raw
      this.currentViewOptionsRefined = refined as ViewOptionsRefined
    }

    return {
      rawOptions: this.currentViewOptionsInput,
      refinedOptions: this.currentViewOptionsRefined,
    }
  }
}

function buildDateEnv(
  timeZone: string,
  explicitLocale: LocaleSingularArg,
  weekNumberCalculation,
  firstDay: number | undefined,
  weekTextLong,
  weekTextShort,
  pluginHooks: PluginHooks,
  availableLocaleData: RawLocaleInfo,
) {
  let locale = buildLocale(explicitLocale || availableLocaleData.defaultCode, availableLocaleData.map)

  return new DateEnv({
    calendarSystem: 'gregory', // TODO: make this a setting
    timeZone,
    locale,
    weekNumberCalculation,
    firstDay,
    weekTextLong,
    weekTextShort,
    cmdFormatter: pluginHooks.cmdFormatter,
  })
}

const warnedUnknownOptions: { [optionName: string]: true } = {}

function filterKnownOptions(options: any, optionRefiners: any): any {
  const knownOptions: any = {}

  for (const optionName in options) {
    if (optionRefiners[optionName]) {
      knownOptions[optionName] = options[optionName]
    } else if (!warnedUnknownOptions[optionName]) {
      warn(`Unknown option \`${optionName}\`.`)
      warnedUnknownOptions[optionName] = true
    }
  }

  return knownOptions
}
