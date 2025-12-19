import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import MuiCssBaseline from '@mui/material/CssBaseline'
import { getMuiTheme } from '@fullcalendar/ui-mui-tailwind/demo-palettes'
import { useDemoChoices } from './lib/demo-choices.js'
import { DemoGenerator } from './lib/demo-generator.js'
import { Layout } from './lib/layout.js'

import '@fullcalendar/core/skeleton.css'
import '@fullcalendar/mui/breezy/theme.css'
import '@fullcalendar/mui/classic/theme.css'
import '@fullcalendar/mui/forma/theme.css'
import '@fullcalendar/mui/monarch/theme.css'
import '@fullcalendar/mui/pulse/theme.css'

import BreezyEventCalendar from '@fullcalendar/mui/breezy/EventCalendar'
import BreezyResourceTimeline from '@fullcalendar/mui/breezy/ResourceTimeline'
import BreezyResourceTimeGrid from '@fullcalendar/mui/breezy/ResourceTimeGrid'
import ClassicEventCalendar from '@fullcalendar/mui/classic/EventCalendar'
import ClassicResourceTimeline from '@fullcalendar/mui/classic/ResourceTimeline'
import ClassicResourceTimeGrid from '@fullcalendar/mui/classic/ResourceTimeGrid'
import FormaEventCalendar from '@fullcalendar/mui/forma/EventCalendar'
import FormaResourceTimeline from '@fullcalendar/mui/forma/ResourceTimeline'
import FormaResourceTimeGrid from '@fullcalendar/mui/forma/ResourceTimeGrid'
import MonarchEventCalendar from '@fullcalendar/mui/monarch/EventCalendar'
import MonarchResourceTimeline from '@fullcalendar/mui/monarch/ResourceTimeline'
import MonarchResourceTimeGrid from '@fullcalendar/mui/monarch/ResourceTimeGrid'
import PulseEventCalendar from '@fullcalendar/mui/pulse/EventCalendar'
import PulseResourceTimeline from '@fullcalendar/mui/pulse/ResourceTimeline'
import PulseResourceTimeGrid from '@fullcalendar/mui/pulse/ResourceTimeGrid'

const eventCalendarByTheme = {
  breezy: BreezyEventCalendar,
  classic: ClassicEventCalendar,
  forma: FormaEventCalendar,
  monarch: MonarchEventCalendar,
  pulse: PulseEventCalendar,
}

const resourceTimelineByTheme = {
  breezy: BreezyResourceTimeline,
  classic: ClassicResourceTimeline,
  forma: FormaResourceTimeline,
  monarch: MonarchResourceTimeline,
  pulse: PulseResourceTimeline,
}

const resourceTimeGridByTheme = {
  breezy: BreezyResourceTimeGrid,
  classic: ClassicResourceTimeGrid,
  forma: FormaResourceTimeGrid,
  monarch: MonarchResourceTimeGrid,
  pulse: PulseResourceTimeGrid,
}

const ui = 'mui'
const mode = 'prod'

function App() {
  const demoChoices = useDemoChoices(ui)
  const { theme, palette, colorScheme } = demoChoices

  const EventCalendar = eventCalendarByTheme[theme]
  const ResourceTimeline = resourceTimelineByTheme[theme]
  const ResourceTimeGrid = resourceTimeGridByTheme[theme]

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
            <EventCalendar {...props} />
          )}
          renderResourceTimeline={(props) => (
            <ResourceTimeline {...props} />
          )}
          renderResourceTimeGrid={(props) => (
            <ResourceTimeGrid {...props} />
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
