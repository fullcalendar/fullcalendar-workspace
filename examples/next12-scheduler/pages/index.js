import FullCalendar from '@fullcalendar/react'
import themePlugin from '@fullcalendar/react/themes/classic'
import interactionPlugin from '@fullcalendar/react/interaction'
import resourceTimelinePlugin from '@fullcalendar/react-scheduler/resource-timeline'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/classic/theme.css'
import '@fullcalendar/react/themes/classic/palette.css'

const todayStr = new Date().toISOString().replace(/T.*$/, '') // YYYY-MM-DD of today

export default function Home() {
  return (
    <FullCalendar
      plugins={[themePlugin, interactionPlugin, resourceTimelinePlugin]}
      initialView='resourceTimelineDay'
      initialDate={todayStr}
      scrollTime='08:00'
      nowIndicator={true}
      editable={true}
      initialEvents={[
        { title: 'nice event', start: todayStr + 'T09:00:00', resourceId: 'a' }
      ]}
      initialResources={[
        { id: 'a', title: 'Auditorium A' },
        { id: 'b', title: 'Auditorium B' },
        { id: 'c', title: 'Auditorium C' }
      ]}
    />
  )
}
