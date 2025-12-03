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
import './lib/ui-default.css'

/*
TODO: in @fullcalendar/theme-breezy, etc, nice way to debug tailwind WITH plugin:
  tailwind-dev:
    export { default as default } from '@fullcalendar/theme-breezy-tailwind'
  tailwind-compiled:
    export { default as default } from '@fullcalendar/theme-breezy-tailwind/_compiled/index'
*/
// import breezyThemePlugin from '@fullcalendar/theme-breezy'
// import classicThemePlugin from '@fullcalendar/theme-classic'
// import formaThemePlugin from '@fullcalendar/theme-forma'
// import monarchThemePlugin from '@fullcalendar/theme-monarch'
// import pulseThemePlugin from '@fullcalendar/theme-pulse'

const pluginByTheme = {
  // breezy: breezyThemePlugin,
  // classic: classicThemePlugin,
  // forma: formaThemePlugin,
  // monarch: monarchThemePlugin,
  // pulse: pulseThemePlugin,
} as any // !!!

const ui = 'default'
const mode = 'prod'

function App() {
  const demoChoices = useDemoChoices(ui)
  const themePlugin = pluginByTheme[demoChoices.theme]

  return (
    <Layout ui={ui} mode={mode} {...demoChoices}>
      <DemoGenerator
        renderEventCalendar={(props) => {
          const availableViews = props.availableViews || eventCalendarAvailableViews
          if (themePlugin) { // !!!
            return (
              <FullCalendar
                initialView={availableViews[0]}
                {...buildToolbarAndButtons(demoChoices.theme, availableViews, props.addButton)}
                {...props}
                plugins={[
                  ...eventCalendarPlugins,
                  themePlugin,
                  ...(props.plugins || []),
                ]}
              />
            )
          }
        }}
        renderScheduler={(props) => {
          const availableViews = props.availableViews || schedulerAvailableViews
          if (themePlugin) { // !!!
            return (
              <FullCalendar
                initialView={availableViews[0]}
                {...buildToolbarAndButtons(demoChoices.theme, availableViews, props.addButton)}
                {...props}
                plugins={[
                  ...eventCalendarPlugins,
                  ...schedulerOnlyPlugins,
                  themePlugin,
                  ...(props.plugins || []),
                ]}
              />
            )
          }
        }}
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
        headerToobar: {
          start: 'add today prev,next',
          center: 'title',
          end: availableViews.join(','),
        }
      }
  }
}
