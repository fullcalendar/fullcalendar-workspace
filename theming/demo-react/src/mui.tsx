import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import MuiCssBaseline from '@mui/material/CssBaseline'
import { getMuiTheme } from '@fullcalendar/ui-mui-tailwind/demo-palettes'
import { useDemoChoices } from './lib/demo-choices.js'
import { DemoGenerator } from './lib/demo-generator.js'
import { Layout } from './lib/layout.js'
import { flattenClassName } from './lib/utils.js'

import '@fullcalendar/core/global.css'

// import BreezyEventCalendar from '@fullcalendar/ui-mui/theme-breezy/EventCalendar'
// import BreezyScheduler from '@fullcalendar/ui-mui/theme-breezy/Scheduler'
// import ClassicEventCalendar from '@fullcalendar/ui-mui/theme-classic/EventCalendar'
// import ClassicScheduler from '@fullcalendar/ui-mui/theme-classic/Scheduler'
// import FormaEventCalendar from '@fullcalendar/ui-mui/theme-forma/EventCalendar'
// import FormaScheduler from '@fullcalendar/ui-mui/theme-forma/Scheduler'
// import MonarchEventCalendar from '@fullcalendar/ui-mui/theme-monarch/EventCalendar'
// import MonarchScheduler from '@fullcalendar/ui-mui/theme-monarch/Scheduler'
// import PulseEventCalendar from '@fullcalendar/ui-mui/theme-pulse/EventCalendar'
// import PulseScheduler from '@fullcalendar/ui-mui/theme-pulse/Scheduler'
/*
  TODO: make nice paths like '@fullcalendar/ui-mui/pulse/Scheduler' ?
*/

const eventCalendarByTheme = {
  // breezy: BreezyEventCalendar,
  // classic: ClassicEventCalendar,
  // forma: FormaEventCalendar,
  // monarch: MonarchEventCalendar,
  // pulse: PulseEventCalendar,
} as any // !!!

const schedulerByTheme = {
  // breezy: BreezyScheduler,
  // classic: ClassicScheduler,
  // forma: FormaScheduler,
  // monarch: MonarchScheduler,
  // pulse: PulseScheduler,
} as any // !!!

const ui = 'mui'
const mode = 'prod'

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
            if (EventCalendar) { // !!!
              return (
                <EventCalendar {...props} className={flattenClassName(props)} />
              )
            }
          }}
          renderScheduler={(props) => {
            const Scheduler = schedulerByTheme[theme]
            if (Scheduler) { // !!!
              return (
                <Scheduler {...props} className={flattenClassName(props)} />
              )
            }
          }}
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
