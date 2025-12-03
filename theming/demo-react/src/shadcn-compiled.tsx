import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useDemoChoices } from './lib/demo-choices.js'
import { DemoGenerator } from './lib/demo-generator.js'
import { Layout } from './lib/layout.js'
import { flattenClassName } from './lib/utils.js'

import '@fullcalendar/core/global.css'
import './lib/ui-shadcn-fonts.js'
import './lib/ui-shadcn.css'

import { EventCalendar as BreezyEventCalendar } from '@fullcalendar/ui-shadcn/theme-breezy/_compiled/event-calendar'
import { Scheduler as BreezyScheduler } from '@fullcalendar/ui-shadcn/theme-breezy/_compiled/scheduler'
// import { EventCalendar as ClassicEventCalendar } from '@fullcalendar/ui-shadcn/theme-classic/_compiled/event-calendar'
// import { Scheduler as ClassicScheduler } from '@fullcalendar/ui-shadcn/theme-classic/_compiled/scheduler'
import { EventCalendar as FormaEventCalendar } from '@fullcalendar/ui-shadcn/theme-forma/_compiled/event-calendar'
import { Scheduler as FormaScheduler } from '@fullcalendar/ui-shadcn/theme-forma/_compiled/scheduler'
import { EventCalendar as MonarchEventCalendar } from '@fullcalendar/ui-shadcn/theme-monarch/_compiled/event-calendar'
import { Scheduler as MonarchScheduler } from '@fullcalendar/ui-shadcn/theme-monarch/_compiled/scheduler'
import { EventCalendar as PulseEventCalendar } from '@fullcalendar/ui-shadcn/theme-pulse/_compiled/event-calendar'
import { Scheduler as PulseScheduler } from '@fullcalendar/ui-shadcn/theme-pulse/_compiled/scheduler'

const eventCalendarByTheme = {
  breezy: BreezyEventCalendar,
  // classic: ClassicEventCalendar,
  forma: FormaEventCalendar,
  monarch: MonarchEventCalendar,
  pulse: PulseEventCalendar,
} as any // !!!

const schedulerByTheme = {
  breezy: BreezyScheduler,
  // classic: ClassicScheduler,
  forma: FormaScheduler,
  monarch: MonarchScheduler,
  pulse: PulseScheduler,
} as any // !!!

const ui = 'shadcn'
const mode = 'compiled'

function App() {
  const demoChoices = useDemoChoices(ui)

  return (
    <Layout ui={ui} mode={mode} {...demoChoices}>
      <DemoGenerator
        renderEventCalendar={(props) => {
          const EventCalendar = eventCalendarByTheme[demoChoices.theme]
          if (EventCalendar) { // !!!
            return <EventCalendar {...props} className={flattenClassName(props)} />
          }
        }}
        renderScheduler={(props) => {
          const Scheduler = schedulerByTheme[demoChoices.theme]
          if (Scheduler) { // !!!
            return <Scheduler {...props} className={flattenClassName(props)} />
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
