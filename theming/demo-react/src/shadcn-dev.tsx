import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Layout } from './lib/layout.js'

import '@fullcalendar/core/global.css'
import './lib/ui-shadcn-fonts.js'
import './lib/ui-shadcn.css'

import { EventCalendar as BreezyEventCalendar } from '@fullcalendar/ui-shadcn/theme-breezy/event-calendar'
import { Scheduler as BreezyScheduler } from '@fullcalendar/ui-shadcn/theme-breezy/scheduler'
import { EventCalendar as ClassicEventCalendar } from '@fullcalendar/ui-shadcn/theme-classic/event-calendar'
import { Scheduler as ClassicScheduler } from '@fullcalendar/ui-shadcn/theme-classic/scheduler'
import { EventCalendar as FormaEventCalendar } from '@fullcalendar/ui-shadcn/theme-forma/event-calendar'
import { Scheduler as FormaScheduler } from '@fullcalendar/ui-shadcn/theme-forma/scheduler'
import { EventCalendar as MonarchEventCalendar } from '@fullcalendar/ui-shadcn/theme-monarch/event-calendar'
import { Scheduler as MonarchScheduler } from '@fullcalendar/ui-shadcn/theme-monarch/scheduler'
import { EventCalendar as PulseEventCalendar } from '@fullcalendar/ui-shadcn/theme-pulse/event-calendar'
import { Scheduler as PulseScheduler } from '@fullcalendar/ui-shadcn/theme-pulse/scheduler'

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
  return (
    <Layout
      ui='shadcn'
      mode='dev'
      renderEventCalendar={(theme, props) => {
        const EventCalendar = eventCalendarByTheme[theme]
        return <EventCalendar {...props} />
      }}
      renderScheduler={(theme, props) => {
        const Scheduler = schedulerByTheme[theme]
        return <Scheduler {...props} />
      }}
    />
  )
}

createRoot(document.documentElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
