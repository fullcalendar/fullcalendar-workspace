import { createPlugin, ViewSpec, assignTo } from 'fullcalendar'
import ResourceTimelineView from './ResourceTimelineView'
import TimelineView from '../timeline/TimelineView'

const RESOURCE_TIMELINE_DEFAULTS = {
  resourceAreaWidth: '30%',
  resourcesInitiallyExpanded: true,
  eventResizableFromStart: true // how is this consumed for TimelineView tho?
}

function transformViewSpec(viewSpec: ViewSpec): ViewSpec {

  if (viewSpec.class === TimelineView && viewSpec.options.resources) {
    return assignTo({}, viewSpec, {
      class: ResourceTimelineView,
      options: assignTo({}, RESOURCE_TIMELINE_DEFAULTS, viewSpec.options)
    })
  }

  return viewSpec
}

export default createPlugin({
  viewSpecTransformers: [ transformViewSpec ]
})
