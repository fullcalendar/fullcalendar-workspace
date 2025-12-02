import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import MuiCssBaseline from '@mui/material/CssBaseline'
import { getMuiTheme } from '@fullcalendar/ui-mui-tailwind/demo-palettes'
import { joinClassNames, ClassNameInput } from '@fullcalendar/core'
import { Layout } from './lib/layout.js'
import { useLocalStorageState } from './lib/hooks.js' // ugghhh

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

function App() {
  const [muiPalette] = useLocalStorageState('muiPalette', 'blue', ['blue'])
  const [colorScheme] = useLocalStorageState<'light' | 'dark'>('colorScheme', 'light', ['light', 'dark'])

  const muiTheme = useMemo(
    () => getMuiTheme(muiPalette, colorScheme),
    [muiPalette, colorScheme],
  )

  return (
    <MuiThemeProvider theme={muiTheme}>
      <MuiCssBaseline />
      <Layout
        ui='mui'
        mode='dev'
        renderEventCalendar={(theme, props) => {
          const EventCalendar = eventCalendarByTheme[theme]
          return (
            <EventCalendar
              {...props}
              className={collapseClassNames(props.class, props.className)}
            />
          )
        }}
        renderScheduler={(theme, props) => {
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
