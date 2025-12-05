import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useDemoChoices } from './lib/demo-choices.js'
import { DemoGenerator } from './lib/demo-generator.js'
import { Layout } from './lib/layout.js'
import { ThemeName } from './lib/config.js'
import FullCalendar from '@fullcalendar/react'
import { eventCalendarAvailableViews, eventCalendarPlugins, EventCalendarProps } from '@fullcalendar/theme-common/event-calendar'
import { schedulerAvailableViews, schedulerOnlyPlugins } from '@fullcalendar/theme-common/scheduler'

import '@fullcalendar/core/global.css'
import './lib/ui-default-fonts.js'
import './lib/ui-default-palettes-vanilla.css'
import '@fullcalendar/theme-breezy/global.css'
import '@fullcalendar/theme-classic/global.css'
import '@fullcalendar/theme-forma/global.css'
import '@fullcalendar/theme-monarch/global.css'
import '@fullcalendar/theme-pulse/global.css'

import breezyThemePlugin from '@fullcalendar/theme-breezy'
import classicThemePlugin from '@fullcalendar/theme-classic'
import formaThemePlugin from '@fullcalendar/theme-forma'
import monarchThemePlugin from '@fullcalendar/theme-monarch'
import pulseThemePlugin from '@fullcalendar/theme-pulse'

const pluginByTheme = {
  breezy: breezyThemePlugin,
  classic: classicThemePlugin,
  forma: formaThemePlugin,
  monarch: monarchThemePlugin,
  pulse: pulseThemePlugin,
}

const ui = 'default'
const mode = 'prod'

function App() {
  const demoChoices = useDemoChoices(ui)
  const themePlugin = pluginByTheme[demoChoices.theme]

  return (
    <Layout ui={ui} mode={mode} {...demoChoices}>
      <DemoGenerator
        renderEventCalendar={({
          availableViews = eventCalendarAvailableViews,
          addButton,
          plugins: userPlugins = [],
          ...restProps
        }) => (
          <FullCalendar
            initialView={availableViews[0]}
            {...buildToolbarAndButtons(demoChoices.theme, availableViews, addButton)}
            plugins={[
              themePlugin,
              ...eventCalendarPlugins,
              ...userPlugins,
            ]}
            {...restProps}
          />
        )}
        renderScheduler={({
          availableViews = schedulerAvailableViews,
          addButton,
          plugins: userPlugins = [],
          ...restProps
        }) => (
          <FullCalendar
            initialView={availableViews[0]}
            {...buildToolbarAndButtons(demoChoices.theme, availableViews, addButton)}
            plugins={[
              themePlugin,
              ...eventCalendarPlugins,
              ...schedulerOnlyPlugins,
              ...userPlugins,
            ]}
            {...restProps}
          />
        )}
      />
    </Layout>
  )
}

createRoot(document.documentElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/* Toolbar
------------------------------------------------------------------------------------------------- */

function buildToolbarAndButtons(
  theme: ThemeName,
  availableViews: string[],
  addButton: EventCalendarProps['addButton'],
) {
  switch (theme) {
    case 'monarch':
    case 'forma':
      return {
        headerToolbar: {
          start: 'add today prev,next title',
          end: availableViews.join(','),
        },
        buttons: {
          add: {
            isPrimary: true,
            ...addButton,
          }
        }
      }
    case 'breezy':
    case 'pulse':
      return {
        headerToolbar: {
          start: 'add prev,today,next',
          center: 'title',
          end: availableViews.join(','),
        },
        buttons: {
          add: {
            isPrimary: true,
            ...addButton,
          }
        }
      }
    case 'classic':
      return {
        headerToolbar: {
          start: 'add today prev,next',
          center: 'title',
          end: availableViews.join(','),
        },
        buttons: {
          add: addButton || {},
        }
      }
  }
}
