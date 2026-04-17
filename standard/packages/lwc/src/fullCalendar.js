import { LightningElement, api } from 'lwc'
import { loadScript, loadStyle } from 'lightning/platformResourceLoader'
import fullCalendarLib from '@salesforce/resourceUrl/fullCalendarLib'

const DEFAULT_THEME = 'classic'
const DEFAULT_PALETTE = 'default'
const REDISPATCHED_CALLBACKS = [
  'eventClick',
  'dateClick',
  'select',
  'eventDrop',
  'eventResize',
  'eventChange',
  'eventAdd',
  'eventRemove',
]

export default class FullCalendar extends LightningElement {
  _calendar = null
  _initialized = false
  _initializationPromise = null
  _options = {}
  _themePalette = null
  _theme = null
  _palette = null
  _locale = null

  renderedCallback() {
    if (this._initialized || this._initializationPromise) {
      return
    }

    this._initializationPromise = this.initializeCalendar().catch((error) => {
      this._initializationPromise = null
      throw error
    })
  }

  disconnectedCallback() {
    if (this._calendar) {
      this._calendar.destroy()
      this._calendar = null
    }

    this._initialized = false
    this._initializationPromise = null
  }

  @api
  get options() {
    return this._options
  }

  set options(value) {
    const nextOptions = value && typeof value === 'object' ? value : {}
    const previousOptions = this._options

    this._options = nextOptions

    if (this._calendar) {
      this.applyOptionDiff(previousOptions, nextOptions)
    }
  }

  @api
  get themePalette() {
    return this._themePalette
  }

  set themePalette(value) {
    this.setStaticConfigProp('_themePalette', value, 'themePalette')
  }

  @api
  get theme() {
    return this._theme
  }

  set theme(value) {
    this.setStaticConfigProp('_theme', value, 'theme')
  }

  @api
  get palette() {
    return this._palette
  }

  set palette(value) {
    this.setStaticConfigProp('_palette', value, 'palette')
  }

  @api
  get locale() {
    return this._locale
  }

  set locale(value) {
    this.setStaticConfigProp('_locale', value, 'locale')
  }

  @api
  getCalendar() {
    return this._calendar
  }

  async initializeCalendar() {
    const { theme, palette } = this.resolveThemeSelection()
    const locale = this.resolveLocale()

    await this.loadAssets(theme, palette, locale)

    if (!this.isConnected) {
      return
    }

    const FullCalendarGlobal = window.FullCalendar

    if (!FullCalendarGlobal || !FullCalendarGlobal.Calendar) {
      throw new Error('FullCalendar global bundle did not expose window.FullCalendar.Calendar')
    }

    const calendar = new FullCalendarGlobal.Calendar(
      this.refs.container,
      this.buildCalendarOptions(this._options, locale),
    )

    calendar.render()

    this._calendar = calendar
    this._initialized = true
  }

  async loadAssets(theme, palette, locale) {
    const assetPromises = [
      loadScript(this, `${fullCalendarLib}/all.global.js`),
      loadStyle(this, `${fullCalendarLib}/skeleton.css`),
      loadScript(this, `${fullCalendarLib}/themes/${theme}/global.js`),
      loadStyle(this, `${fullCalendarLib}/themes/${theme}/theme.css`),
      loadStyle(this, `${fullCalendarLib}/themes/${theme}/palettes/${palette}.css`),
    ]

    if (locale) {
      assetPromises.push(loadScript(this, `${fullCalendarLib}/locales/${locale}.global.js`))
    }

    await Promise.all(assetPromises)
  }

  buildCalendarOptions(options, locale) {
    const mergedOptions = {
      ...(options || {}),
      ...this.buildCallbackOptions(),
    }

    if (locale) {
      mergedOptions.locale = locale
    }

    return mergedOptions
  }

  buildCallbackOptions() {
    const callbackOptions = {}

    for (const callbackName of REDISPATCHED_CALLBACKS) {
      callbackOptions[callbackName] = (info) => {
        const consumerCallback = this._options?.[callbackName]

        // The global bundle runs through window, so preserve that callback receiver for parity.
        if (typeof consumerCallback === 'function') {
          consumerCallback.call(window, info)
        }

        // Synthetic shadow retargets DOM events, so forward FullCalendar payloads as plain detail data.
        this.dispatchEvent(new CustomEvent(callbackName.toLowerCase(), {
          detail: info,
          bubbles: false,
          composed: false,
        }))
      }
    }

    return callbackOptions
  }

  applyOptionDiff(previousOptions, nextOptions) {
    if (this.resolveLocaleFromOptions(previousOptions) !== this.resolveLocaleFromOptions(nextOptions)) {
      this.warnStaticSettingChange('locale')
    }

    const previousView = previousOptions?.initialView
    const nextView = nextOptions?.initialView

    if (!Object.is(previousView, nextView) && nextView) {
      this._calendar.changeView(nextView)
    }

    const previousDate = previousOptions?.initialDate
    const nextDate = nextOptions?.initialDate

    if (!Object.is(previousDate, nextDate) && nextDate) {
      this._calendar.gotoDate(nextDate)
    }

    const eventsChanged = !Object.is(previousOptions?.events, nextOptions?.events)
    const eventSourcesChanged = !Object.is(previousOptions?.eventSources, nextOptions?.eventSources)

    if (eventsChanged || eventSourcesChanged) {
      this.resetEventSources(nextOptions)
    }

    const optionNames = new Set([
      ...Object.keys(previousOptions || {}),
      ...Object.keys(nextOptions || {}),
    ])

    for (const optionName of optionNames) {
      if (
        optionName === 'initialDate' ||
        optionName === 'initialView' ||
        optionName === 'events' ||
        optionName === 'eventSources' ||
        optionName === 'locale' ||
        REDISPATCHED_CALLBACKS.includes(optionName)
      ) {
        continue
      }

      const previousValue = previousOptions?.[optionName]
      const nextValue = nextOptions?.[optionName]

      if (!Object.is(previousValue, nextValue)) {
        this._calendar.setOption(optionName, nextValue)
      }
    }
  }

  resetEventSources(options) {
    this._calendar.removeAllEventSources()

    const eventSources = options?.eventSources

    if (Array.isArray(eventSources)) {
      for (const eventSource of eventSources) {
        this._calendar.addEventSource(eventSource)
      }
    } else if (eventSources) {
      this._calendar.addEventSource(eventSources)
    }

    if (options?.events !== undefined) {
      this._calendar.addEventSource(options.events)
    }
  }

  resolveThemeSelection() {
    const themePalette = this.normalizeString(this._themePalette)

    if (themePalette) {
      const [themePart, palettePart] = themePalette.split('/')

      return {
        theme: this.normalizeString(themePart) || DEFAULT_THEME,
        palette: this.normalizeString(palettePart) || DEFAULT_PALETTE,
      }
    }

    return {
      theme: this.normalizeString(this._theme) || DEFAULT_THEME,
      palette: this.normalizeString(this._palette) || DEFAULT_PALETTE,
    }
  }

  resolveLocale() {
    return this.normalizeString(this._locale) || this.resolveLocaleFromOptions(this._options) || ''
  }

  resolveLocaleFromOptions(options) {
    return this.normalizeString(options?.locale)
  }

  setStaticConfigProp(fieldName, value, publicName) {
    const normalizedValue = this.normalizeString(value)

    if ((this._initialized || this._initializationPromise) && this[fieldName] !== normalizedValue) {
      this.warnStaticSettingChange(publicName)
      return
    }

    this[fieldName] = normalizedValue
  }

  warnStaticSettingChange(settingName) {
    console.warn(
      `[fullCalendar] ${settingName} is only applied during initial render. Recreate the component to change it.`,
    )
  }

  normalizeString(value) {
    if (typeof value !== 'string') {
      return null
    }

    const trimmedValue = value.trim()

    return trimmedValue || null
  }
}