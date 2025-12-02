import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import MuiCssBaseline from '@mui/material/CssBaseline'
import { getMuiTheme } from '@fullcalendar/ui-mui-tailwind/demo-palettes'
import { joinClassNames, ClassNameInput } from '@fullcalendar/core'
import { useDemoChoices } from './lib/demo-choices.js'
import { DemoGenerator } from './lib/demo-generator.js'
import { Layout } from './lib/layout.js'

import '@fullcalendar/core/global.css'
import './lib/tailwind.css'

import BreezyEventCalendar from '@fullcalendar/ui-mui-tailwind/theme-breezy/EventCalendar'
import BreezyScheduler from '@fullcalendar/ui-mui-tailwind/theme-breezy/Scheduler'
import ClassicEventCalendar from '@fullcalendar/ui-mui-tailwind/theme-classic/EventCalendar'
import ClassicScheduler from '@fullcalendar/ui-mui-tailwind/theme-classic/Scheduler'
import FormaEventCalendar from '@fullcalendar/ui-mui-tailwind/theme-forma/EventCalendar'
import FormaScheduler from '@fullcalendar/ui-mui-tailwind/theme-forma/Scheduler'
import MonarchEventCalendar from '@fullcalendar/ui-mui-tailwind/theme-monarch/EventCalendar'
import MonarchScheduler from '@fullcalendar/ui-mui-tailwind/theme-monarch/Scheduler'
import PulseEventCalendar from '@fullcalendar/ui-mui-tailwind/theme-pulse/EventCalendar'
import PulseScheduler from '@fullcalendar/ui-mui-tailwind/theme-pulse/Scheduler'

const eventCalendarByTheme = {
  breezy: BreezyEventCalendar,
  classic: ClassicEventCalendar,
  forma: FormaEventCalendar,
  monarch: MonarchEventCalendar,
  pulse: PulseEventCalendar,
}

const schedulerByTheme = {
  breezy: BreezyScheduler,
  classic: ClassicScheduler,
  forma: FormaScheduler,
  monarch: MonarchScheduler,
  pulse: PulseScheduler,
}

const ui = 'mui'
const mode = 'dev'

function App() {
  const demoChoices = useDemoChoices(ui)
  const { theme, palette, colorScheme } = demoChoices

  const muiTheme = useMemo(
    () => getMuiTheme(palette, colorScheme),
    [palette, colorScheme],
  )

  return (
    <Layout ui={ui} mode={mode} {...demoChoices}>
      <MuiThemeProvider theme={muiTheme}>
        <MuiCssBaseline />
        <DemoGenerator
          renderEventCalendar={(props) => {
            const EventCalendar = eventCalendarByTheme[theme]
            return (
              <EventCalendar
                {...props}
                className={collapseClassNames(props.class, props.className)}
              />
            )
          }}
          renderScheduler={(props) => {
            const Scheduler = schedulerByTheme[theme]
            return (
              <Scheduler
                {...props}
                className={collapseClassNames(props.class, props.className)}
              />
            )
          }}
        />
      </MuiThemeProvider>
    </Layout>
  )
}

function collapseClassNames(
  className0: ClassNameInput,
  className1: ClassNameInput,
): string {
  return joinClassNames(
    Array.isArray(className0) ? joinClassNames(...className0) : className0,
    Array.isArray(className1) ? joinClassNames(...className1) : className1,
  )
}

createRoot(document.documentElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
