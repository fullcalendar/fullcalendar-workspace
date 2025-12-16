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
import { ResourceTimeline as BreezyScheduler } from '@fullcalendar/ui-shadcn/theme-breezy/_compiled/resource-timeline'
import { EventCalendar as ClassicEventCalendar } from '@fullcalendar/ui-shadcn/theme-classic/_compiled/event-calendar'
import { ResourceTimeline as ClassicScheduler } from '@fullcalendar/ui-shadcn/theme-classic/_compiled/resource-timeline'
import { EventCalendar as FormaEventCalendar } from '@fullcalendar/ui-shadcn/theme-forma/_compiled/event-calendar'
import { ResourceTimeline as FormaScheduler } from '@fullcalendar/ui-shadcn/theme-forma/_compiled/resource-timeline'
import { EventCalendar as MonarchEventCalendar } from '@fullcalendar/ui-shadcn/theme-monarch/_compiled/event-calendar'
import { ResourceTimeline as MonarchScheduler } from '@fullcalendar/ui-shadcn/theme-monarch/_compiled/resource-timeline'
import { EventCalendar as PulseEventCalendar } from '@fullcalendar/ui-shadcn/theme-pulse/_compiled/event-calendar'
import { ResourceTimeline as PulseScheduler } from '@fullcalendar/ui-shadcn/theme-pulse/_compiled/resource-timeline'

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

const ui = 'shadcn'
const mode = 'prod' // even tho files from _compiled, still the most finalize state

function App() {
  const demoChoices = useDemoChoices(ui)

  const EventCalendar = eventCalendarByTheme[demoChoices.theme]
  const Scheduler = schedulerByTheme[demoChoices.theme]

  return (
    <Layout ui={ui} mode={mode} {...demoChoices}>
      <DemoGenerator
        renderEventCalendar={(props) => (
          <EventCalendar {...props} className={flattenClassName(props)} />
        )}
        renderScheduler={(props) => (
          <Scheduler {...props} className={flattenClassName(props)} />
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
