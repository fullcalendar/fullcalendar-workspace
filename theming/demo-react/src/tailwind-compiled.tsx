import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useDemoChoices } from './lib/demo-choices.js'
import { DemoGenerator } from './lib/demo-generator.js'
import { Layout } from './lib/layout.js'

import '@fullcalendar/core/global.css'
import './lib/tailwind.css'
import './lib/ui-default-fonts.js'
import './lib/ui-default.css'

import { EventCalendar as BreezyEventCalendar } from '@fullcalendar/ui-default-react-tailwind/theme-breezy/_compiled/event-calendar'
import { Scheduler as BreezyScheduler } from '@fullcalendar/ui-default-react-tailwind/theme-breezy/_compiled/scheduler'
import { EventCalendar as ClassicEventCalendar } from '@fullcalendar/ui-default-react-tailwind/theme-classic/_compiled/event-calendar'
import { Scheduler as ClassicScheduler } from '@fullcalendar/ui-default-react-tailwind/theme-classic/_compiled/scheduler'
import { EventCalendar as FormaEventCalendar } from '@fullcalendar/ui-default-react-tailwind/theme-forma/_compiled/event-calendar'
import { Scheduler as FormaScheduler } from '@fullcalendar/ui-default-react-tailwind/theme-forma/_compiled/scheduler'
import { EventCalendar as MonarchEventCalendar } from '@fullcalendar/ui-default-react-tailwind/theme-monarch/_compiled/event-calendar'
import { Scheduler as MonarchScheduler } from '@fullcalendar/ui-default-react-tailwind/theme-monarch/_compiled/scheduler'
import { EventCalendar as PulseEventCalendar } from '@fullcalendar/ui-default-react-tailwind/theme-pulse/_compiled/event-calendar'
import { Scheduler as PulseScheduler } from '@fullcalendar/ui-default-react-tailwind/theme-pulse/_compiled/scheduler'

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

const ui = 'default'
const mode = 'compiled'

function App() {
  const demoChoices = useDemoChoices(ui)

  const EventCalendar = eventCalendarByTheme[demoChoices.theme]
  const Scheduler = schedulerByTheme[demoChoices.theme]

  return (
    <Layout ui={ui} mode={mode} {...demoChoices}>
      <DemoGenerator
        renderEventCalendar={(props) => (
          <EventCalendar {...props} />
        )}
        renderScheduler={(props) => (
          <Scheduler {...props} />
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
