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

export const compiledEventCalendarByTheme: Record<string, string> = {
  breezy: breezyEventCalendarRaw,
  classic: classicEventCalendarRaw,
  forma: formaEventCalendarRaw,
  monarch: monarchEventCalendarRaw,
  pulse: pulseEventCalendarRaw,
}

export const compiledSchedulerByTheme: Record<string, string> = {
  breezy: breezySchedulerRaw,
  classic: classicSchedulerRaw,
  forma: formaSchedulerRaw,
  monarch: monarchSchedulerRaw,
  pulse: pulseSchedulerRaw,
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
}: {
  themeName: ThemeName,
  paletteName: string,
  colorScheme: 'light' | 'dark', // light|dark
  colorSchemeTechnique: 'component-prop' | 'data-attribute' | 'class-name' | 'media-query',
  colorSchemeDataAttribute: string,
  pluginMap: Record<string, string>, // { jsVarName => importName }
  isScheduler: boolean,
  availableViews: string[],
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
      initialView='${availableViews[0]}'
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
}: {
  colorScheme: 'light' | 'dark',
  colorSchemeTechnique: 'component-prop' | 'data-attribute' | 'class-name' | 'media-query',
  colorSchemeDataAttribute: string,
  pluginMap: Record<string, string>, // { jsVarName => importName }
  isScheduler: boolean,
  availableViews: string[],
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
    />
  )
}
`
}
