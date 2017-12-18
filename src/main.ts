import * as exportHooks from 'fullcalendar'

// imports solely for side-effects
import './exports'
import './Calendar'
import './Constraints'
import './View'
import './component/DateComponent'
import './component/InteractiveDateComponent'
import './component/renderers/EventRenderer'
import './component/interactions/DateSelecting'
import './component/interactions/EventDragging'
import './component/interactions/EventResizing'
import './component/interactions/ExternalDropping'
import './models/EventSource'
import './models/EventDef'
import './models/EventDefMutation'
import './timeline/config'
import './resource-timeline/config'
import './resource-basic/config'
import './resource-agenda/config'
import './types/input-types'
import './types/jquery-hooks'

const schedulerVersion = '<%= version %>';
(exportHooks as any).schedulerVersion = schedulerVersion

/*
When the required internal version is upped,
also update the .json files with a new minor version requirement.
Example: bump ~2.7.2 to ~2.8.0
Use a tilde to match future patch-level changes only!
*/
if (exportHooks.internalApiVersion !== 12) {
  throw new Error(
    'v' + schedulerVersion + ' of FullCalendar Scheduler ' +
    'is incompatible with v' + exportHooks.version + ' of the core.\n' +
    'Please see http://fullcalendar.io/support/ for more information.'
  )
}
