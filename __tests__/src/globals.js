import 'fullcalendar/tests/automated/globals'
import InteractionPlugin from '@fullcalendar/interaction'
import DayGridPlugin from '@fullcalendar/daygrid'
import TimeGridPlugin from '@fullcalendar/timegrid'
import ListPlugin from '@fullcalendar/list'
import TimelinePlugin from '@fullcalendar/timeline'
import ResourceTimelinePlugin from '@fullcalendar/resource-timeline'
import ResourceDayGridPlugin from '@fullcalendar/resource-daygrid'
import ResourceTimeGridPlugin from '@fullcalendar/resource-timegrid'

const DEFAULT_PLUGINS = [
  InteractionPlugin,
  DayGridPlugin,
  TimeGridPlugin,
  ListPlugin,
  TimelinePlugin,
  ResourceTimelinePlugin,
  ResourceDayGridPlugin,
  ResourceTimeGridPlugin
]

pushOptions({
  plugins: DEFAULT_PLUGINS
})
