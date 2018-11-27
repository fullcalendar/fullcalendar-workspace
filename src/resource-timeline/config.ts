import { createPlugin, ViewDef, assignTo } from 'fullcalendar'
import ResourceTimelineView from './ResourceTimelineView'
import TimelineView from '../timeline/TimelineView'

const RESOURCE_TIMELINE_DEFAULTS = {
  resourceAreaWidth: '30%',
  resourcesInitiallyExpanded: true,
  eventResizableFromStart: true // how is this consumed for TimelineView tho?
}

function transformViewDef(viewDef: ViewDef, overrides): ViewDef {

  if (viewDef.class === TimelineView && overrides.resources) {
    return {
      type: viewDef.type,
      class: ResourceTimelineView,
      overrides: viewDef.overrides,
      defaults: assignTo({}, viewDef.defaults, RESOURCE_TIMELINE_DEFAULTS)
    }
  }

  return viewDef
}

export default createPlugin({
  viewDefTransformers: [ transformViewDef ]
})
