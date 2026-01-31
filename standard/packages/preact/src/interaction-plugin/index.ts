import { PluginDefInput } from '../plugin-system-struct'
import { DateClicking } from './interactions/DateClicking'
import { DateSelecting } from './interactions/DateSelecting'
import { EventDragging, EventDragStartData, EventDragStopData } from './interactions/EventDragging'
import { EventResizing, EventResizeStartData, EventResizeStopData } from './interactions/EventResizing'
import { UnselectAuto } from './interactions/UnselectAuto'
import { FeaturefulElementDragging } from './dnd/FeaturefulElementDragging'
import { ExternalDraggable } from './interactions-external/ExternalDraggable'

export default {
  name: 'interaction',
  componentInteractions: [DateClicking, DateSelecting, EventDragging, EventResizing],
  calendarInteractions: [UnselectAuto],
  elementDraggingImpl: FeaturefulElementDragging,
} as PluginDefInput

export { ThirdPartyDraggable } from './interactions-external/ThirdPartyDraggable'
export {
  ExternalDraggable as Draggable,
  EventDragStartData,
  EventDragStopData,
  EventResizeStartData,
  EventResizeStopData,
}
