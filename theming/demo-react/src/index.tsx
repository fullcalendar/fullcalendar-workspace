import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useDemoChoices } from './lib/demo-choices.js'
import { DemoGenerator } from './lib/demo-generator.js'
import { Layout } from './lib/layout.js'
import { ThemeName } from './lib/config.js'
import FullCalendar from '@fullcalendar/react'
import { eventCalendarAvailableViews, eventCalendarPlugins, EventCalendarProps } from '@fullcalendar/theme-common/event-calendar'
import { schedulerAvailableViews, schedulerOnlyPlugins } from '@fullcalendar/theme-common/scheduler'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/breezy/theme.css'
import '@fullcalendar/react/themes/classic/theme.css'
import '@fullcalendar/react/themes/forma/theme.css'
import '@fullcalendar/react/themes/monarch/theme.css'
import '@fullcalendar/react/themes/pulse/theme.css'
import './lib/ui-default-fonts.js'
import './lib/ui-default-palettes-vanilla.css'

import breezyThemePlugin from '@fullcalendar/react/themes/breezy'
import classicThemePlugin from '@fullcalendar/react/themes/classic'
import formaThemePlugin from '@fullcalendar/react/themes/forma'
import monarchThemePlugin from '@fullcalendar/react/themes/monarch'
import pulseThemePlugin from '@fullcalendar/react/themes/pulse'

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
          buttons: userButtons,
          ...restUserProps
        }) => {
          const { buttons: newButtons, ...restNewProps } = buildToolbarAndButtons(demoChoices.theme, availableViews, addButton)
          return (
            <FullCalendar
              initialView={availableViews[0]}
              plugins={[
                themePlugin,
                ...eventCalendarPlugins,
                ...userPlugins,
              ]}
              buttons={{
                ...newButtons,
                ...userButtons,
              }}
              {...restNewProps}
              {...restUserProps}
            />
          )
        }}
        renderResourceTimeline={({
          availableViews = schedulerAvailableViews,
          addButton,
          plugins: userPlugins = [],
          buttons: userButtons,
          ...restUserProps
        }) => {
          const { buttons: newButtons, ...restNewProps } = buildToolbarAndButtons(demoChoices.theme, availableViews, addButton)
          return (
            <FullCalendar
              initialView={availableViews[0]}
              plugins={[
                themePlugin,
                ...eventCalendarPlugins,
                ...schedulerOnlyPlugins,
                ...userPlugins,
              ]}
              buttons={{
                ...newButtons,
                ...userButtons,
              }}
              {...restNewProps}
              {...restUserProps}
            />
          )
        }}
        renderResourceTimeGrid={({ // TODO: DRY
          availableViews = schedulerAvailableViews,
          addButton,
          plugins: userPlugins = [],
          buttons: userButtons,
          ...restUserProps
        }) => {
          const { buttons: newButtons, ...restNewProps } = buildToolbarAndButtons(demoChoices.theme, availableViews, addButton)
          return (
            <FullCalendar
              initialView={availableViews[0]}
              plugins={[
                themePlugin,
                ...eventCalendarPlugins,
                ...schedulerOnlyPlugins,
                ...userPlugins,
              ]}
              buttons={{
                ...newButtons,
                ...userButtons,
              }}
              {...restNewProps}
              {...restUserProps}
            />
          )
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
