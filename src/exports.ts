import * as exportHooks from 'fullcalendar'
import ResourceAgendaView from './resource-agenda/ResourceAgendaView'
import ResourceBasicView from './resource-basic/ResourceBasicView'
import ResourceMonthView from './resource-basic/ResourceMonthView'
import TimelineView from './timeline/TimelineView'
import ResourceTimelineView from './resource-timeline/ResourceTimelineView'

// TODO: find a better way
(exportHooks as any).ResourceAgendaView = ResourceAgendaView;
(exportHooks as any).ResourceBasicView = ResourceBasicView;
(exportHooks as any).ResourceMonthView = ResourceMonthView;
(exportHooks as any).TimelineView = TimelineView;
(exportHooks as any).ResourceTimelineView = ResourceTimelineView
