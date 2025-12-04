import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import MuiCssBaseline from '@mui/material/CssBaseline'
import { getMuiTheme } from '@fullcalendar/ui-mui-tailwind/demo-palettes'
import { useDemoChoices } from './lib/demo-choices.js'
import { DemoGenerator } from './lib/demo-generator.js'
import { Layout } from './lib/layout.js'
import { flattenClassName } from './lib/utils.js'

// !!!
import './lib/tailwind.css'
// NOTE: also see ./lib/tailwind.css for !!!

import '@fullcalendar/core/global.css'
import '@fullcalendar/mui/breezy/global.css'
import '@fullcalendar/mui/classic/global.css'
import '@fullcalendar/mui/forma/global.css'
import '@fullcalendar/mui/monarch/global.css'
import '@fullcalendar/mui/pulse/global.css'

import BreezyEventCalendar from '@fullcalendar/mui/breezy/EventCalendar'
import BreezyScheduler from '@fullcalendar/mui/breezy/Scheduler'
import ClassicEventCalendar from '@fullcalendar/mui/classic/EventCalendar'
import ClassicScheduler from '@fullcalendar/mui/classic/Scheduler'
import FormaEventCalendar from '@fullcalendar/mui/forma/EventCalendar'
import FormaScheduler from '@fullcalendar/mui/forma/Scheduler'
import MonarchEventCalendar from '@fullcalendar/mui/monarch/EventCalendar'
import MonarchScheduler from '@fullcalendar/mui/monarch/Scheduler'
import PulseEventCalendar from '@fullcalendar/mui/pulse/EventCalendar'
import PulseScheduler from '@fullcalendar/mui/pulse/Scheduler'

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
const mode = 'prod'

function App() {
  const demoChoices = useDemoChoices(ui)
  const { theme, palette, colorScheme } = demoChoices

  const EventCalendar = eventCalendarByTheme[theme]
  const Scheduler = schedulerByTheme[theme]

  const muiTheme = useMemo(
    () => getMuiTheme(palette, colorScheme),
    [palette, colorScheme],
  )

  return (
    <Layout ui={ui} mode={mode} {...demoChoices}>
      <MuiThemeProvider theme={muiTheme}>
        <MuiCssBaseline />
        <DemoGenerator
          renderEventCalendar={(props) => (
            <EventCalendar {...props} className={flattenClassName(props)} />
          )}
          renderScheduler={(props) => (
            <Scheduler {...props} className={flattenClassName(props)} />
          )}
        />
      </MuiThemeProvider>
    </Layout>
  )
}

createRoot(document.documentElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
