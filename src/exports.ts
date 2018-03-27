import * as exportHooks from 'fullcalendar'
import ResourceAgendaView from './resource-agenda/ResourceAgendaView'
import ResourceBasicView from './resource-basic/ResourceBasicView'
import ResourceMonthView from './resource-basic/ResourceMonthView'
import TimelineView from './timeline/TimelineView'
import ResourceTimelineView from './resource-timeline/ResourceTimelineView'

export {
  ResourceInput,
  ResourceSourceInput,
  ResourceComplexInput,
  ResourceFunction,
  ResourceFunctionCallback
} from './types/input-types'

// TODO: find a better way
(exportHooks as any).ResourceAgendaView = ResourceAgendaView;
(exportHooks as any).ResourceBasicView = ResourceBasicView;
(exportHooks as any).ResourceMonthView = ResourceMonthView;
(exportHooks as any).TimelineView = TimelineView;
(exportHooks as any).ResourceTimelineView = ResourceTimelineView

export { default as ResourceAgendaView } from './resource-agenda/ResourceAgendaView'
export { default as ResourceDayGrid } from './resource-basic/ResourceDayGrid'
export { default as ResourceBasicView } from './resource-basic/ResourceBasicView'
export { default as ResourceMonthView } from './resource-basic/ResourceMonthView'
export { default as TimelineView } from './timeline/TimelineView'
export { initScaleProps } from './timeline/TimelineView.defaults'
export { default as TimelineEventDragging } from './timeline/interactions/TimelineEventDragging'
export { default as TimelineEventResizing } from './timeline/interactions/TimelineEventResizing'
export { default as TimelineFillRenderer } from './timeline/renderers/TimelineFillRenderer'
export { default as TimelineHelperRenderer } from './timeline/renderers/TimelineHelperRenderer'
export { default as TimelineEventRenderer } from './timeline/renderers/TimelineEventRenderer'
export { default as ResourceTimelineView } from './resource-timeline/ResourceTimelineView'
export { default as ResourceTimeGrid } from './resource-agenda/ResourceTimeGrid'
export { default as ClippedScroller } from './util/ClippedScroller'
export { default as EnhancedScroller } from './util/EnhancedScroller'
export { default as ScrollerCanvas } from './util/ScrollerCanvas'
export { default as ScrollFollower } from './util/ScrollFollower'
export { default as ScrollFollowerSprite } from './util/ScrollFollowerSprite'
export { default as ScrollJoiner } from './util/ScrollJoiner'
export { default as ResourceTimelineEventRenderer } from './resource-timeline/ResourceTimelineEventRenderer'
export { default as Spreadsheet } from './resource-timeline/Spreadsheet'
export { default as EventRow } from './resource-timeline/row/EventRow'
export { default as HRowGroup } from './resource-timeline/row/HRowGroup'
export { default as ResourceRow } from './resource-timeline/row/ResourceRow'
export { default as RowGroup } from './resource-timeline/row/RowGroup'
export { default as RowParent } from './resource-timeline/row/RowParent'
export { default as VRowGroup } from './resource-timeline/row/VRowGroup'
export { default as Resource } from './models/Resource'
export { default as ResourceComponentFootprint } from './models/ResourceComponentFootprint'
export { default as ResourceManager } from './models/ResourceManager'
export { default as ResourceDayTableMixin, ResourceDayTableInterface } from './component/ResourceDayTableMixin'
