import Layout from '@/components/layout'
import FullCalendar from '@fullcalendar/react'
import themePlugin from '@fullcalendar/react/themes/classic'
import interactionPlugin from '@fullcalendar/react/interaction'
import resourceTimelinePlugin from '@fullcalendar/react-scheduler/resource-timeline'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/classic/theme.css'
import '@fullcalendar/react/themes/classic/palette.css'

const todayStr = new Date().toISOString().replace(/T.*$/, '') // YYYY-MM-DD of today

export default function TimelinePage() {
  return (
    <Layout>
      <div className='calendar-container'>
        <FullCalendar
          plugins={[
            themePlugin,
            interactionPlugin,
            resourceTimelinePlugin,
          ]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          initialView='resourceTimelineWeek'
          initialDate={todayStr}
          scrollTime='08:00'
          nowIndicator={true}
          editable={true}
          selectable={true}
          selectMirror={true}
          resources={[
            { id: 'a', title: 'Auditorium A' },
            { id: 'b', title: 'Auditorium B', eventColor: 'green' },
            { id: 'c', title: 'Auditorium C', eventColor: 'orange' },
          ]}
          initialEvents={[
            { title: 'nice event', start: todayStr + 'T09:00:00', resourceId: 'a' }
          ]}
        />
      </div>
    </Layout>
  )
}
