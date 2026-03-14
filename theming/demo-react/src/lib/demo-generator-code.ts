import { ThemeName } from './config'
import { buildToolbarAndButtons, DEFAULT_DATA_ATTRIBUTE } from './demo-generator-util'

import breezyEventCalendarRaw from '../../../ui-default-react-tailwind/src/theme-breezy/_compiled/event-calendar-simple.tsx?raw'
import classicEventCalendarRaw from '../../../ui-default-react-tailwind/src/theme-classic/_compiled/event-calendar-simple.tsx?raw'
import formaEventCalendarRaw from '../../../ui-default-react-tailwind/src/theme-forma/_compiled/event-calendar-simple.tsx?raw'
import monarchEventCalendarRaw from '../../../ui-default-react-tailwind/src/theme-monarch/_compiled/event-calendar-simple.tsx?raw'
import pulseEventCalendarRaw from '../../../ui-default-react-tailwind/src/theme-pulse/_compiled/event-calendar-simple.tsx?raw'

import breezySchedulerRaw from '../../../ui-default-react-tailwind/src/theme-breezy/_compiled/scheduler-simple.tsx?raw'
import classicSchedulerRaw from '../../../ui-default-react-tailwind/src/theme-classic/_compiled/scheduler-simple.tsx?raw'
import formaSchedulerRaw from '../../../ui-default-react-tailwind/src/theme-forma/_compiled/scheduler-simple.tsx?raw'
import monarchSchedulerRaw from '../../../ui-default-react-tailwind/src/theme-monarch/_compiled/scheduler-simple.tsx?raw'
import pulseSchedulerRaw from '../../../ui-default-react-tailwind/src/theme-pulse/_compiled/scheduler-simple.tsx?raw'

import breezyThemeCssRaw from '../../../../standard/packages/preact/src/themes/breezy/theme.css?raw'
import classicThemeCssRaw from '../../../../standard/packages/preact/src/themes/classic/theme.css?raw'
import formaThemeCssRaw from '../../../../standard/packages/preact/src/themes/forma/theme.css?raw'
import monarchThemeCssRaw from '../../../../standard/packages/preact/src/themes/monarch/theme.css?raw'
import pulseThemeCssRaw from '../../../../standard/packages/preact/src/themes/pulse/theme.css?raw'

import breezyPaletteEmeraldRaw from '../../../../standard/packages/preact/src/themes/breezy/palettes/emerald.css?raw'
import breezyPaletteHoneyRaw from '../../../../standard/packages/preact/src/themes/breezy/palettes/honey.css?raw'
import breezyPaletteIndigoRaw from '../../../../standard/packages/preact/src/themes/breezy/palettes/indigo.css?raw'
import breezyPaletteRoseRaw from '../../../../standard/packages/preact/src/themes/breezy/palettes/rose.css?raw'
import classicPaletteRaw from '../../../../standard/packages/preact/src/themes/classic/palette.css?raw'
import formaPaletteBlueRaw from '../../../../standard/packages/preact/src/themes/forma/palettes/blue.css?raw'
import formaPaletteGreenRaw from '../../../../standard/packages/preact/src/themes/forma/palettes/green.css?raw'
import formaPalettePurpleRaw from '../../../../standard/packages/preact/src/themes/forma/palettes/purple.css?raw'
import formaPaletteRedRaw from '../../../../standard/packages/preact/src/themes/forma/palettes/red.css?raw'
import monarchPaletteBlueRaw from '../../../../standard/packages/preact/src/themes/monarch/palettes/blue.css?raw'
import monarchPaletteGreenRaw from '../../../../standard/packages/preact/src/themes/monarch/palettes/green.css?raw'
import monarchPalettePurpleRaw from '../../../../standard/packages/preact/src/themes/monarch/palettes/purple.css?raw'
import monarchPaletteRedRaw from '../../../../standard/packages/preact/src/themes/monarch/palettes/red.css?raw'
import monarchPaletteYellowRaw from '../../../../standard/packages/preact/src/themes/monarch/palettes/yellow.css?raw'
import pulsePaletteBlueRaw from '../../../../standard/packages/preact/src/themes/pulse/palettes/blue.css?raw'
import pulsePaletteGreenRaw from '../../../../standard/packages/preact/src/themes/pulse/palettes/green.css?raw'
import pulsePalettePurpleRaw from '../../../../standard/packages/preact/src/themes/pulse/palettes/purple.css?raw'
import pulsePaletteRedRaw from '../../../../standard/packages/preact/src/themes/pulse/palettes/red.css?raw'

const compiledEventCalendarByTheme: Record<string, string> = {
  breezy: breezyEventCalendarRaw,
  classic: classicEventCalendarRaw,
  forma: formaEventCalendarRaw,
  monarch: monarchEventCalendarRaw,
  pulse: pulseEventCalendarRaw,
}

const compiledSchedulerByTheme: Record<string, string> = {
  breezy: breezySchedulerRaw,
  classic: classicSchedulerRaw,
  forma: formaSchedulerRaw,
  monarch: monarchSchedulerRaw,
  pulse: pulseSchedulerRaw,
}

const themeCssByTheme: Record<string, string> = {
  breezy: breezyThemeCssRaw,
  classic: classicThemeCssRaw,
  forma: formaThemeCssRaw,
  monarch: monarchThemeCssRaw,
  pulse: pulseThemeCssRaw,
}

const paletteCssByTheme: Record<string, string | Record<string, string>> = {
  breezy: {
    emerald: breezyPaletteEmeraldRaw,
    honey: breezyPaletteHoneyRaw,
    indigo: breezyPaletteIndigoRaw,
    rose: breezyPaletteRoseRaw,
  },
  classic: classicPaletteRaw,
  forma: {
    blue: formaPaletteBlueRaw,
    green: formaPaletteGreenRaw,
    purple: formaPalettePurpleRaw,
    red: formaPaletteRedRaw,
  },
  monarch: {
    blue: monarchPaletteBlueRaw,
    green: monarchPaletteGreenRaw,
    purple: monarchPalettePurpleRaw,
    red: monarchPaletteRedRaw,
    yellow: monarchPaletteYellowRaw,
  },
  pulse: {
    blue: pulsePaletteBlueRaw,
    green: pulsePaletteGreenRaw,
    purple: pulsePalettePurpleRaw,
    red: pulsePaletteRedRaw,
  },
}

export function getCompiledEventCalendar(
  themeName: string,
  needsThemeCss: boolean,
): string {
  let code = compiledEventCalendarByTheme[themeName]

  code = code.replace('import React from \'react\'', '')

  code = code.replace(
    'from \'@fullcalendar/react\'',
    'from \'@fullcalendar/react\'' +
      '\nimport \'@fullcalendar/react/skeleton.css\'' +
      (needsThemeCss ? '\nimport \'./theme.css\'' : '') +
      '\nimport \'./palette.css\''
  )

  if (!needsThemeCss) {
    code = code.replace(/\s*(reset-root|button-reset)\s*/g, '')
  }

  return code.trim()
}

export function getCompiledScheduler(themeName: string): string {
  let code = compiledSchedulerByTheme[themeName]

  code = code.replace('import React from \'react\'', '')

  return code.trim()
}

export function getThemeCss(themeName: string): string {
  return themeCssByTheme[themeName].trim()
}

export function getPaletteCss(
  themeName: string,
  paletteName: string,
  dataAttributeOverride: string,
  classNameOverride: boolean,
  mediaQueryOverride: boolean,
): string | undefined {
  const entry = paletteCssByTheme[themeName]
  let css = typeof entry === 'string' ? entry : entry?.[paletteName]

  if (dataAttributeOverride) {
    css = css.replaceAll('[data-color-scheme=dark]', `[${dataAttributeOverride}=dark]`)
  } else if (classNameOverride) {
    css = css.replaceAll('[data-color-scheme=dark]', `.dark`)
  } else if (mediaQueryOverride) {
    css = css.replace(
      /\[data-color-scheme=dark\]\s*\{([\s\S]*?)\}/g,
      (_, inner) => {
        const reindented = inner.replace(/^  /mg, '    ')
        return `@media (prefers-color-scheme: dark) {\n  :root {${reindented}  }\n}`
      }
    )
  }

  return css.trim()
}

export function getStockAppCode({
  themeName,
  paletteName,
  colorScheme,
  colorSchemeTechnique,
  colorSchemeDataAttribute,
  pluginMap,
  isScheduler,
  availableViews,
  initialView,
}: {
  themeName: ThemeName,
  paletteName: string,
  colorScheme: 'light' | 'dark', // light|dark
  colorSchemeTechnique: 'component-prop' | 'data-attribute' | 'class-name' | 'media-query',
  colorSchemeDataAttribute: string,
  pluginMap: Record<string, string>, // { jsVarName => importName }
  isScheduler: boolean,
  availableViews: string[],
  initialView?: string
}): string {
  const { headerToolbar } = buildToolbarAndButtons(themeName, availableViews, undefined)

  return `import { Calendar } from '@fullcalendar/react'
import themePlugin from '@fullcalendar/react/themes/${themeName}'
${Object.keys(pluginMap).map((importSymbol) => (
  `import ${importSymbol} from '${pluginMap[importSymbol]}'`
)).join('\n')}

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/${themeName}/theme.css'
${(
  colorSchemeTechnique === 'component-prop' ||
  (colorSchemeTechnique === 'data-attribute' && colorSchemeDataAttribute === DEFAULT_DATA_ATTRIBUTE)
) ? (
  paletteName
    ? `import '@fullcalendar/react/themes/${themeName}/palettes/${paletteName}.css'`
    : `import '@fullcalendar/react/themes/${themeName}/palette.css'`
) : (
  `import './palette.css'`
)}

${
  colorSchemeTechnique === 'data-attribute' ? (
    `document.body.setAttribute('${colorSchemeDataAttribute}', '${colorScheme}')\n\n`
  ) : colorSchemeTechnique === 'class-name' ? (
    `document.body.classList.add('${colorScheme}')\n\n`
  ) : ''
}export function App() {
  return (
    <Calendar
${colorSchemeTechnique === 'component-prop'
  ? `      colorScheme='${colorScheme}'\n`
  : ''
}      plugins={[
        themePlugin,
${Object.keys(pluginMap).map((importSymbol) => (
`        ${importSymbol},`
)).join('\n')}
      ]}
      headerToolbar={{
${
        headerToolbar.start ? (
`        start: '${headerToolbar.start}',\n`
        ) : ''
        }${
        headerToolbar.center ? (
`        center: '${headerToolbar.center}',\n`
        ) : ''
        }${
        headerToolbar.end ? (
`        end: '${headerToolbar.end}',\n`
        ) : ''
}      }}
      buttons={{
        add: {
          text: 'Add ${isScheduler ? 'Resource' : 'Event'}',
          click() {
            alert('handle add ${isScheduler ? 'resource' : 'event'}...')
          },
        }
      }}
      initialView='${initialView ?? availableViews[0]}'
    />
  )
}
`
}

export function getForkedAppCode({
  colorScheme,
  colorSchemeTechnique,
  colorSchemeDataAttribute,
  pluginMap,
  isScheduler,
  availableViews,
  initialView,
}: {
  colorScheme: 'light' | 'dark',
  colorSchemeTechnique: 'component-prop' | 'data-attribute' | 'class-name' | 'media-query',
  colorSchemeDataAttribute: string,
  pluginMap: Record<string, string>, // { jsVarName => importName }
  isScheduler: boolean,
  availableViews: string[],
  initialView?: string
}): string {
  return `${Object.keys(pluginMap).map((importSymbol) => (
  `import ${importSymbol} from '${pluginMap[importSymbol]}'`
)).join('\n')}
${isScheduler ? (
  `import { Scheduler } from './scheduler'`
) : (
  `import { EventCalendar } from './event-calendar'`
)}

${
  colorSchemeTechnique === 'data-attribute' ? (
    `document.body.setAttribute('${colorSchemeDataAttribute}', '${colorScheme}')\n\n`
  ) : colorSchemeTechnique === 'class-name' ? (
    `document.body.classList.add('${colorScheme}')\n\n`
  ) : ''
}export function App() {
  return (
    <${isScheduler ? 'Scheduler' : 'EventCalendar'}
      plugins={[
${Object.keys(pluginMap).map((importSymbol) => (
`        ${importSymbol},`
)).join('\n')}
      ]}
      addButton={{
        text: 'Add ${isScheduler ? 'Resource' : 'Event'}',
        click() {
          alert('handle add ${isScheduler ? 'resource' : 'event'}...')
        },
      }}
      availableViews={['${availableViews.join('\', \'')}']}
      initialView='${initialView ?? availableViews[0]}'
    />
  )
}
`
}
