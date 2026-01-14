import { createPlugin, PluginDef } from '@fullcalendar/core'
import { DateClicking } from './interactions/DateClicking'
import { DateSelecting } from './interactions/DateSelecting'
import { EventDragging } from './interactions/EventDragging'
import { EventResizing } from './interactions/EventResizing'
import { UnselectAuto } from './interactions/UnselectAuto'
import { FeaturefulElementDragging } from './dnd/FeaturefulElementDragging'
import { OPTION_REFINERS, LISTENER_REFINERS } from './options'
import './ambient'

export default createPlugin({
  name: '<%= pkgName %>',
  componentInteractions: [DateClicking, DateSelecting, EventDragging, EventResizing],
  calendarInteractions: [UnselectAuto],
  elementDraggingImpl: FeaturefulElementDragging,
  optionRefiners: OPTION_REFINERS,
  listenerRefiners: LISTENER_REFINERS,
}) as PluginDef

export * from './public-types'
export { ExternalDraggable as Draggable } from './interactions-external/ExternalDraggable'
export { ThirdPartyDraggable } from './interactions-external/ThirdPartyDraggable'
