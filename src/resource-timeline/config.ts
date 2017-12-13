import { Calendar, getViewConfig } from 'fullcalendar'
import ResourceTimelineView from './ResourceTimelineView'

getViewConfig('timeline').resourceClass = ResourceTimelineView

Calendar.defaults.resourcesInitiallyExpanded = true
