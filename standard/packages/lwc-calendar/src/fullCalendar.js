import { LightningElement, api } from 'lwc'
import { loadScript, loadStyle } from 'lightning/platformResourceLoader'
import fullCalendarLib from '@salesforce/resourceUrl/fullCalendarLib'

const DEFAULT_THEME = 'classic'
const DEFAULT_PALETTE = 'default'
const DEFAULT_LOCALE = 'en'

// These values may be replaced by the build system.
const ADDITIONAL_DEFAULT_OPTIONS = {}
const ADDITIONAL_PLUGIN_GLOBAL_URL = null
const ADDITIONAL_REDISPATCHED_CALLBACKS = []

const REDISPATCHED_CALLBACKS = [
  'eventClick',
  'dateClick',
  'select',
  'eventDrop',
  'eventResize',
  'eventChange',
  'eventAdd',
  'eventRemove',
  ...ADDITIONAL_REDISPATCHED_CALLBACKS,
]

export default class FullCalendar extends LightningElement {
  _calendar = null
  _initialized = false
  _initializationPromise = null
  _options = {}
  _theme = null
  _themePalette = null
  _themePlugin = null
  _locale = null
  _additionalPlugins = []
  _localeChangePromise = null

  renderedCallback() {
    if (this._initialized || this._initializationPromise) {
      return
    }

    this._localeChangePromise = null

    const initializationPromise = this._initializationPromise = this.initializeCalendar()
    initializationPromise.catch((error) => {
      if (this._initializationPromise === initializationPromise) {
        this._initializationPromise = null
      }

      console.error(error)
    })
  }

  disconnectedCallback() {
    const initializationPromise = this._initializationPromise

    if (initializationPromise) {
      const finishDisconnection = () => {
        if (!this.isConnected && this._initializationPromise === initializationPromise) {
          this.destroyCalendar()
          this._initializationPromise = null
        }
      }

      initializationPromise.then(finishDisconnection, finishDisconnection)
    } else {
      this.destroyCalendar()
    }
  }

  destroyCalendar() {
    this._localeChangePromise = null

    if (this._calendar) {
      this._calendar.destroy()
      this._calendar = null
    }

    this._initialized = false
  }

  @api
  get options() {
    return this._options
  }

  set options(value) {
    const nextOptions = value && typeof value === 'object' ? value : {}

    this._options = nextOptions

    if (this._calendar) {
      const appliedLocale = this._calendar.getOption('locale')
      this._calendar.resetOptions(this.buildCalendarOptions(nextOptions, appliedLocale))
    }
  }

  @api
  get theme() {
    return this._theme
  }

  set theme(value) {
    this.setStaticConfigProp('_theme', value, 'theme')
  }

  @api
  get themePalette() {
    return this._themePalette
  }

  set themePalette(value) {
    this.setStaticConfigProp('_themePalette', value, 'themePalette')
  }

  @api
  get locale() {
    return this._locale
  }

  set locale(value) {
    if (this._locale === value) {
      return
    }

    this._locale = value
    this.queueLocaleChange(normalizeLocale(value))
  }

  @api
  getCalendar() {
    return this._calendar
  }

  async initializeCalendar() {
    const { theme, palette } = this.resolveThemeSelection()
    const locale = normalizeLocale(this._locale)

    const { themePlugin, additionalPlugins } = await loadFullCalendarAssets(
      this,
      theme,
      palette,
      locale,
    )

    this._themePlugin = themePlugin
    this._additionalPlugins = additionalPlugins

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

  buildCalendarOptions(options, locale) {
    const mergedOptions = {
      ...ADDITIONAL_DEFAULT_OPTIONS,
      ...(options || {}),
      ...this.buildCallbackOptions(),
      plugins: [
        ...(options?.plugins || []),
        ...this._additionalPlugins,
        this._themePlugin,
      ],
    }

    delete mergedOptions.locale

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

  resolveThemeSelection() {
    return {
      theme: this._theme || DEFAULT_THEME,
      palette: this._themePalette || DEFAULT_PALETTE,
    }
  }

  queueLocaleChange(locale) {
    const initializationPromise = this._initializationPromise

    if (!this._calendar && !initializationPromise) {
      return
    }

    const previousPromise = this._localeChangePromise || initializationPromise || Promise.resolve()
    const localeChangePromise = previousPromise
      .catch(() => undefined)
      .then(async () => {
        const calendar = this._calendar

        if (!calendar) {
          return
        }

        if (locale) {
          await loadLocaleGlobal(this, locale)
        }

        if (this._calendar === calendar) {
          calendar.setOption('locale', locale || '')
        }
      })

    this._localeChangePromise = localeChangePromise
    localeChangePromise.catch((error) => {
      console.error(error)
    })
  }

  setStaticConfigProp(fieldName, value, publicName) {
    if ((this._initialized || this._initializationPromise) && this[fieldName] !== value) {
      this.warnStaticSettingChange(publicName)
      return
    }

    this[fieldName] = value
  }

  warnStaticSettingChange(settingName) {
    console.warn(
      `[fullCalendar] ${settingName} is only applied during initial render. Recreate the component to change it.`,
    )
  }
}

function normalizeLocale(locale) {
  return locale === DEFAULT_LOCALE ? '' : locale
}

const LOCALE_PROMISES = new Map()
const PLUGIN_GLOBAL_PROMISES = new Map()
let fullCalendarGlobalPromise = null
let pluginGlobalLoadQueue = Promise.resolve()

async function loadFullCalendarAssets(component, theme, palette, locale) {
  await Promise.all([
    loadFullCalendarGlobal(component),
    loadStyle(component, `${fullCalendarLib}/skeleton.css`),
  ])

  const additionalPlugins = ADDITIONAL_PLUGIN_GLOBAL_URL
    ? await loadPluginGlobal(component, ADDITIONAL_PLUGIN_GLOBAL_URL)
    : []

  if (locale) {
    await loadLocaleGlobal(component, locale)
  }

  const themePlugin = await loadThemePlugin(component, theme)

  await loadStyle(component, `${fullCalendarLib}/themes/${theme}/theme.css`)
  await loadStyle(
    component,
    theme === 'classic'
      ? `${fullCalendarLib}/themes/classic/palette.css`
      : `${fullCalendarLib}/themes/${theme}/palettes/${palette}.css`,
  )

  return { themePlugin, additionalPlugins }
}

function loadFullCalendarGlobal(component) {
  if (!fullCalendarGlobalPromise) {
    const loadPromise = loadScript(component, `${fullCalendarLib}/all/global.js`)

    fullCalendarGlobalPromise = loadPromise
    loadPromise.catch(() => {
      if (fullCalendarGlobalPromise === loadPromise) {
        fullCalendarGlobalPromise = null
      }
    })
  }

  return fullCalendarGlobalPromise
}

function loadLocaleGlobal(component, locale) {
  let localePromise = LOCALE_PROMISES.get(locale)

  if (!localePromise) {
    localePromise = loadScript(component, `${fullCalendarLib}/locales/${locale}/global.js`)
    LOCALE_PROMISES.set(locale, localePromise)
    localePromise.catch(() => {
      if (LOCALE_PROMISES.get(locale) === localePromise) {
        LOCALE_PROMISES.delete(locale)
      }
    })
  }

  return localePromise
}

async function loadThemePlugin(component, theme) {
  const themePlugins = await loadPluginGlobal(
    component,
    `${fullCalendarLib}/themes/${theme}/global.js`,
  )

  if (themePlugins.length !== 1 || themePlugins[0]?.name !== `theme-${theme}`) {
    throw new Error(`FullCalendar theme ${theme} did not register its expected plugin`)
  }

  return themePlugins[0]
}

function loadPluginGlobal(component, url) {
  let pluginPromise = PLUGIN_GLOBAL_PROMISES.get(url)

  if (!pluginPromise) {
    pluginPromise = pluginGlobalLoadQueue.then(async () => {
      const globalPlugins = window.FullCalendar?.globalPlugins

      if (!Array.isArray(globalPlugins)) {
        throw new Error('FullCalendar global bundle did not expose its global plugins array')
      }

      const startIndex = globalPlugins.length

      await loadScript(component, url)

      return globalPlugins.splice(startIndex)
    })

    PLUGIN_GLOBAL_PROMISES.set(url, pluginPromise)
    pluginGlobalLoadQueue = pluginPromise.then(() => undefined, () => undefined)
    pluginPromise.catch(() => {
      if (PLUGIN_GLOBAL_PROMISES.get(url) === pluginPromise) {
        PLUGIN_GLOBAL_PROMISES.delete(url)
      }
    })
  }

  return pluginPromise
}
