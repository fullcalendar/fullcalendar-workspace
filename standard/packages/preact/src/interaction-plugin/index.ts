import { createPlugin } from '../plugin-system'
import { PluginDef } from '../plugin-system-struct'
import { DateClicking } from './interactions/DateClicking'
import { DateSelecting } from './interactions/DateSelecting'
import { EventDragging } from './interactions/EventDragging'
import { EventResizing } from './interactions/EventResizing'
import { UnselectAuto } from './interactions/UnselectAuto'
import { FeaturefulElementDragging } from './dnd/FeaturefulElementDragging'

export default createPlugin({
  name: '<%= pkgName %>',
  componentInteractions: [DateClicking, DateSelecting, EventDragging, EventResizing],
  calendarInteractions: [UnselectAuto],
  elementDraggingImpl: FeaturefulElementDragging,
}) as PluginDef
