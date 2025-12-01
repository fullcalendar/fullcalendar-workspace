import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Layout } from './lib/layout.js'

import '@fullcalendar/core/global.css'
import adaptivePlugin from '@fullcalendar/adaptive'
import scrollGridPlugin from '@fullcalendar/scrollgrid'

import { EventCalendar } from '@fullcalendar/ui-default-react-tailwind/theme-breezy/event-calendar'
import { Scheduler } from '@fullcalendar/ui-default-react-tailwind/theme-breezy/scheduler'
import { eventCalendarProps, eventCalendarPlugins } from '@fullcalendar/theme-common/event-calendar'
import { resourceTimelineProps, vResourceProps } from '@fullcalendar/theme-common/scheduler'

import './lib/tailwind.css'
import './lib/ui-default-fonts.js'
import './lib/ui-default.css'

function App() {
  return (
    <Layout ui='default' mode='dev'>
      <EventCalendar
        {...eventCalendarProps}
        initialView='dayGridMonth'
        availableViews={['dayGridMonth', 'timeGridWeek', 'timeGridDay', 'listWeek', 'multiMonthYear']}
        plugins={[...eventCalendarPlugins, scrollGridPlugin, adaptivePlugin]}
      />
      <EventCalendar
        {...eventCalendarProps}
        initialView='timeGridWeek'
        plugins={[...eventCalendarPlugins, scrollGridPlugin, adaptivePlugin]}
      />
      <EventCalendar
        {...eventCalendarProps}
        initialView='multiMonthYear'
        plugins={[...eventCalendarPlugins, scrollGridPlugin, adaptivePlugin]}
      />
      <EventCalendar
        {...eventCalendarProps}
        initialView='dayGridYear'
        availableViews={['dayGridYear']}
        plugins={[...eventCalendarPlugins, scrollGridPlugin, adaptivePlugin]}
      />
      <EventCalendar
        {...eventCalendarProps}
        initialView='listYear'
        availableViews={['listYear', 'listMonth', 'listWeek']}
        plugins={[...eventCalendarPlugins, scrollGridPlugin, adaptivePlugin]}
        listText='' // displays nicer list-view-button text
      />
      <Scheduler
        {...resourceTimelineProps}
        initialView='resourceTimelineThreeDay'
        availableViews={['resourceTimelineDay', 'resourceTimelineThreeDay', 'resourceTimelineWeek']}
      />
      <Scheduler
        {...vResourceProps}
        initialView='resourceTimeGridFiveDay'
        availableViews={['resourceTimeGridDay', 'resourceTimeGridTwoDay', 'resourceTimeGridFiveDay', 'resourceTimeGridWeek']}
      />
    </Layout>
  )
}

createRoot(document.documentElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
