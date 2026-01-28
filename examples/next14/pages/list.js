import Layout from '@/components/layout'
import FullCalendar from '@fullcalendar/react'
import themePlugin from '@fullcalendar/react/themes/classic'
import interactionPlugin from '@fullcalendar/react/interaction'
import listPlugin from '@fullcalendar/react/list'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/classic/theme.css'
import '@fullcalendar/react/themes/classic/palette.css'

const todayStr = new Date().toISOString().replace(/T.*$/, '') // YYYY-MM-DD of today

export default function ListPage() {
  return (
    <Layout>
      <div className='calendar-container'>
        <FullCalendar
          plugins={[
            themePlugin,
            interactionPlugin,
            listPlugin,
          ]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          initialView='listYear'
          initialDate={todayStr}
          nowIndicator={true}
          editable={true}
          selectable={true}
          selectMirror={true}
          initialEvents={[
            { title: 'nice event', start: todayStr + 'T09:00:00' }
          ]}
        />
      </div>
    </Layout>
  )
}
