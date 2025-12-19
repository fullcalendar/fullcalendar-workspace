import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useDemoChoices } from './lib/demo-choices.js'
import { DemoGenerator } from './lib/demo-generator.js'
import { Layout } from './lib/layout.js'

import '@fullcalendar/core/skeleton.css'
import './lib/ui-shadcn-fonts.js'
import './lib/ui-shadcn.css'

import { EventCalendar as BreezyEventCalendar } from '@fullcalendar/ui-shadcn/theme-breezy/_compiled/event-calendar'
import { ResourceTimeline as BreezyResourceTimeline } from '@fullcalendar/ui-shadcn/theme-breezy/_compiled/resource-timeline'
import { ResourceTimeGrid as BreezyResourceTimeGrid } from '@fullcalendar/ui-shadcn/theme-breezy/_compiled/resource-timegrid'
import { EventCalendar as ClassicEventCalendar } from '@fullcalendar/ui-shadcn/theme-classic/_compiled/event-calendar'
import { ResourceTimeline as ClassicResourceTimeline } from '@fullcalendar/ui-shadcn/theme-classic/_compiled/resource-timeline'
import { ResourceTimeGrid as ClassicResourceTimeGrid } from '@fullcalendar/ui-shadcn/theme-classic/_compiled/resource-timegrid'
import { EventCalendar as FormaEventCalendar } from '@fullcalendar/ui-shadcn/theme-forma/_compiled/event-calendar'
import { ResourceTimeline as FormaResourceTimeline } from '@fullcalendar/ui-shadcn/theme-forma/_compiled/resource-timeline'
import { ResourceTimeGrid as FormaResourceTimeGrid } from '@fullcalendar/ui-shadcn/theme-forma/_compiled/resource-timegrid'
import { EventCalendar as MonarchEventCalendar } from '@fullcalendar/ui-shadcn/theme-monarch/_compiled/event-calendar'
import { ResourceTimeline as MonarchResourceTimeline } from '@fullcalendar/ui-shadcn/theme-monarch/_compiled/resource-timeline'
import { ResourceTimeGrid as MonarchResourceTimeGrid } from '@fullcalendar/ui-shadcn/theme-monarch/_compiled/resource-timegrid'
import { EventCalendar as PulseEventCalendar } from '@fullcalendar/ui-shadcn/theme-pulse/_compiled/event-calendar'
import { ResourceTimeline as PulseResourceTimeline } from '@fullcalendar/ui-shadcn/theme-pulse/_compiled/resource-timeline'
import { ResourceTimeGrid as PulseResourceTimeGrid } from '@fullcalendar/ui-shadcn/theme-pulse/_compiled/resource-timegrid'

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

const ui = 'shadcn'
const mode = 'prod' // even tho files from _compiled, still the most finalize state

function App() {
  const demoChoices = useDemoChoices(ui)

  const EventCalendar = eventCalendarByTheme[demoChoices.theme]
  const ResourceTimeline = resourceTimelineByTheme[demoChoices.theme]
  const ResourceTimeGrid = resourceTimeGridByTheme[demoChoices.theme]

  return (
    <Layout ui={ui} mode={mode} {...demoChoices}>
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
    </Layout>
  )
}

createRoot(document.documentElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
